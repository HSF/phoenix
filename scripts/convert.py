#!/usr/bin/python
import sys, json
from optparse import OptionParser

def main():
    usage = "usage: %prog [options] arg"
    parser = OptionParser()
    parser.add_option("-o", "--output", dest="filename",
    help="write event data to FILE", metavar="FILE")
    parser.add_option("-q", "--quiet",
    action="store_false", dest="verbose", default=True,
    help="don't print status messages to stdout")
    
    (options, args) = parser.parse_args()
    
    print "DEBUG", options, args
    
    #Try to build sensible input filenames
    inputhitsfile = ""
    inputtruthfile = ""
    inputparticlesfile = ""
    if args:
        for file in args:
            base = file.split('.')[0]
            if 'hits' in base:
                if not inputhitsfile:
                    inputhitsfile=file
                else:
                    print "Multiple hits files listed! Ignoring this one: ",file
            elif 'truth' in base:
                if not inputhitsfile:
                    inputtruthfile=file
                else:
                    print "Multiple truth files listed! Ignoring this one: ",file
            elif 'particles' in base:
                if not inputparticlesfile:
                    inputparticlesfile=file
                else:
                    print "Multiple particle files listed! Ignoring this one: ",file
            
                #TODO sanity checks here.
    else:
        print "Error: no input provided so aborting. Run 'convert -h' to see options."
        sys.exit(1)
    
    output=""
    # Let's assume the input filename make sense i.e. event000000016-hits.csv
    base = args[0].split('.')[0]
    
    event_num = int(filter(str.isdigit, base))
    
    if not options.filename:
        output = base.split('-')[0]+'.json'
    
    if options.verbose:
        print 'Input files are:'
        print 'Hits      :\t',inputhitsfile
        print 'Truth     :\t',inputtruthfile
        print 'Particles :\t',inputparticlesfile
        print
        print 'Output filename: ', output
        print 'Event number: ', event_num
        
        
    outputfile = open(output, 'w')
    outputfile.write('{')
    outputfile.write('"event number":{}, "run number":{}'.format(event_num,0))
    
    if inputhitsfile:
        outputfile.write(', ')
        processHits(outputfile,inputhitsfile)
    
    outputfile.write('}')
    

def processHits(outputfile,inputhitsfile):
    
    inputfile= open(inputhitsfile, 'r') 


    outputfile.write(' "Hits": {  "Spacepoints" : [' )
    first = True

    for line in inputfile:
        if not line or 'hit_id' in line:
            continue
        if not first:
            outputfile.write(',')
        else:
            print('First')
            first=False
        values = line.split(',')
        x=values[4]
        y=values[5]
        z=values[6]

        outputfile.write('[{}, {}, {}]'.format(x,y,z))
 
    outputfile.write(' ] }')
    
if __name__ == "__main__":
    main()