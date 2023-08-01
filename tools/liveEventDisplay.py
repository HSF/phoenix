import os, sys

# number of events to convert to phoenix format
nbEvts = 10

# where to find the raw data
data_dir = "/calib/online/evdisp/TDET/EvDisp"

# where to put the phoenix data
eosDir = "/eos/project/l/lhcbwebsites/www/lhcb-media/EventDisplay"

# content of the option file we'll use to create the phoenix data
optionFileContent = '''
from Moore import options, run_reconstruction
from RecoConf.standalone import phoenix_data_dump_hlt2
from RecoConf.hlt1_tracking import make_VeloClusterTrackingSIMD
from PyConf.Algorithms import VeloRetinaClusterTrackingSIMD

from Configurables import LHCb__Det__LbDD4hep__DD4hepSvc as DD4hepSvc
dd4hepSvc = DD4hepSvc()
dd4hepSvc.DetectorList = ['/world', 'VP', 'FT', 'Magnet', 'Rich1', 'Rich2', 'Ecal', 'Hcal', 'Muon']

options.evt_max = %d
options.use_iosvc = True
options.event_store = 'EvtStoreSvc'
options.phoenix_filename = "%s"
options.input_files = ["%s"]
options.input_type = 'MDF'
options.data_type = 'Upgrade'
options.simulation = False
options.geometry_version = 'trunk'
options.conditions_version = 'master'

with make_VeloClusterTrackingSIMD.bind(algorithm=VeloRetinaClusterTrackingSIMD):
    run_reconstruction(options, phoenix_data_dump_hlt2)
'''

# bash commands to execute to run gaudi job
scriptFileContent = '''
source /cvmfs/lhcb.cern.ch/lib/etc/cern_profile.sh
lb-run Moore/latest gaudirun.py %s
'''

# get last but one file created (last one may still be written to)
files = [os.path.join(data_dir, file) for file in os.listdir(data_dir)]
files = sorted(files, key=os.path.getmtime)
if len(files) < 2:
    print("No new data, exiting")
    sys.exit(0)
mdfFile = files[-2]
mdfFileName, ext = os.path.splitext(mdfFile)
if ext != '.mdf':
    print("Unknown file extension, exiting (File was %s)" % mdfFile)
    sys.exit(1)
print("Found %d mdf files available, will use %s" % (len(files), mdfFile))

# check whether we've already processed that file. If yes, just exit
eosFileName = os.path.join(eosDir, os.path.basename(mdfFileName) + '.json.zip')
if os.path.exists(eosFileName):
    print("no new data, exiting")
    sys.exit(0)

# check whether that file has substancial data. If not, just exit
size = os.path.getsize(mdfFile)
if size < 1000*100:
    print("Got surprisingly small MDF file (%d bytes), probably not in data taking mode, exiting" % size)
    sys.exit(1)
    
# copy the file to the local FS or we cannot use IOAlgMM
# which is the default alg for opening MDF
import shutil
import tempfile
_, localMDFFileName = tempfile.mkstemp(suffix=".mdf")
shutil.copy(mdfFile, localMDFFileName)

# run gaudi job to create phoenix input file from original MDF
import subprocess
with tempfile.NamedTemporaryFile(mode="w",suffix=".py") as optionFile, \
     tempfile.NamedTemporaryFile(mode="w",suffix=".sh") as bashScript:
    _, phoenixFileName = tempfile.mkstemp(suffix=".json")
    optionFile.write(optionFileContent % (nbEvts, phoenixFileName, localMDFFileName))
    optionFile.flush()
    bashScript.write(scriptFileContent % optionFile.name)
    bashScript.flush()
    subprocess.run(["cat", bashScript.name])
    p = subprocess.run(". %s" % bashScript.name, shell=True)
    if p.returncode != 0:
        print("Failed to run Gaudi process, return code was %d, exiting" % p.returncode)
        print("stdout :")
        print(p.stdout)
        print("stderr :")
        print(p.stderr)
        os.remove(phoenixFileName)
        os.remove(localMDFFileName)
        sys.exit(1)
os.remove(localMDFFileName)

# postprocess the json file to drop events with no VP tracks
import json
content = json.load(open(phoenixFileName, 'rb'))
newcontent = {}
for event in content:
    if len(content[event]['Tracks']['VeloTracks']) > 0:
        newcontent[event] = content[event]
    else:
        print ("No VP track in %s, dropping event" % event)
# overwrite file with remaining event
json.dump(newcontent, open(phoenixFileName, 'w'))

# some sanity checks
try:
    size = os.path.getsize(phoenixFileName)
    if size < 1000*100:
        print("Got surprisingly small phoenix file (%d bytes), exiting" % size)
        os.remove(phoenixFileName)
        sys.exit(1)
except OSError:
    print("Failed to create phoenix data, exiting")
    sys.exit(1)

# zip resulting file
import zipfile
_, zippedPhoenixFileName = tempfile.mkstemp(suffix=".json.zip")
zipfile.ZipFile(zippedPhoenixFileName, mode='w', compression=zipfile.ZIP_DEFLATED, compresslevel=9).write(phoenixFileName)
os.unlink(phoenixFileName)
    
# move resulting file to EOS
shutil.copyfile(zippedPhoenixFileName, eosFileName)
os.unlink(zippedPhoenixFileName)

# recreate lastestEvents symlink in an atomic way
latestFileName = os.path.join(eosDir, 'liveEvents.json.zip')
newLatestFileName = os.path.join(eosDir, 'newLiveEvents.json.zip')
os.symlink(eosFileName, newLatestFileName)
os.rename(newLatestFileName, latestFileName)
