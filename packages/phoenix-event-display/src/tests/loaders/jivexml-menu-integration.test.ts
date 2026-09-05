/**
 * @jest-environment jsdom
 */
import { Group } from 'three';
import { JiveXMLLoader } from '../../loaders/jivexml-loader';
import { InfoLogger } from '../../helpers/info-logger';
import { ThreeManager } from '../../managers/three-manager';
import { UIManager } from '../../managers/ui-manager';
import { PhoenixMenuNode } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PhoenixMenuUI } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-ui';
import { type ConfigSelect } from '../../managers/ui-manager/phoenix-menu/config-types';
import { EVENT_DATA_TYPE_COLORS } from '../../helpers/constants';

jest.mock('../../managers/three-manager');

describe('JiveXML to Phoenix menu integration', () => {
  it('should only offer "Color by" Vertex for track collections with linked vertices', () => {
    // Two track collections; vertices link only to the one named "Tracks"
    // (which the loader renames to "Tracks_").
    const xml = `<Event eventNumber="1" runNumber="1" lumiBlock="1" dateTime="2026-01-01">
      <Track count="2" storeGateKey="Tracks">
        <chi2>1.0 2.0</chi2>
        <numDoF>3 4</numDoF>
        <pt>10.0 -20.0</pt>
        <d0>0.1 0.2</d0>
        <z0>1.0 2.0</z0>
        <phi0>0.5 1.0</phi0>
        <cotTheta>1.0 0.5</cotTheta>
      </Track>
      <Track count="2" storeGateKey="OtherTracks">
        <chi2>1.0 2.0</chi2>
        <numDoF>3 4</numDoF>
        <pt>10.0 -20.0</pt>
        <d0>0.1 0.2</d0>
        <z0>1.0 2.0</z0>
        <phi0>0.5 1.0</phi0>
        <cotTheta>1.0 0.5</cotTheta>
      </Track>
      <RVx count="1" storeGateKey="TestVertices">
        <x>0.1</x><y>0.2</y><z>0.3</z>
        <chi2>1.0</chi2>
        <primVxCand>1</primVxCand>
        <vertexType>1</vertexType>
        <numTracks>1</numTracks>
        <sgkey>Tracks</sgkey>
        <tracks>0</tracks>
      </RVx>
    </Event>`;

    const three = new ThreeManager(new InfoLogger());
    (three.addEventDataTypeGroup as jest.Mock).mockImplementation(
      () => new Group(),
    );
    (three.getSceneManager as jest.Mock).mockReturnValue({
      collectionFilter: jest.fn(),
      scaleJets: jest.fn(),
      scaleChildObjects: jest.fn(),
      scaleInstancedObjects: jest.fn(),
    });

    const phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu');
    const phoenixMenuUI = new PhoenixMenuUI(phoenixMenuRoot, three);
    phoenixMenuUI.addEventDataFolder();

    const ui = new UIManager(three);
    (ui as any).uiMenus = [phoenixMenuUI];

    const loader = new JiveXMLLoader();
    loader.process(xml);
    const eventData = loader.getEventData();
    loader.buildEventData(eventData, three, ui, new InfoLogger());

    const getColorByOptions = (collectionName: string) => {
      const collectionNode = phoenixMenuRoot.findInTree(collectionName);
      const select = collectionNode
        ?.findInTree('Color Options')
        ?.configs.find((config) => config.type === 'select') as ConfigSelect;
      return select?.options;
    };

    expect(getColorByOptions('Tracks_')).toEqual([
      'Charge q',
      'Momentum |p|',
      'Vertex',
    ]);
    expect(getColorByOptions('OtherTracks')).toEqual([
      'Charge q',
      'Momentum |p|',
    ]);
  });

  it('should show the color the tracks are actually drawn with', () => {
    // JiveXML tracks carry no color of their own, so they are drawn in the
    // default color for tracks - which is what the menu has to show.
    const xml = `<Event eventNumber="1" runNumber="1" lumiBlock="1" dateTime="2026-01-01">
      <Track count="1" storeGateKey="SomeTracks">
        <chi2>1.0</chi2>
        <numDoF>3</numDoF>
        <pt>10.0</pt>
        <d0>0.1</d0>
        <z0>1.0</z0>
        <phi0>0.5</phi0>
        <cotTheta>1.0</cotTheta>
      </Track>
    </Event>`;

    const three = new ThreeManager(new InfoLogger());
    (three.addEventDataTypeGroup as jest.Mock).mockImplementation(
      () => new Group(),
    );
    (three.getSceneManager as jest.Mock).mockReturnValue({
      collectionFilter: jest.fn(),
      scaleJets: jest.fn(),
      scaleChildObjects: jest.fn(),
      scaleInstancedObjects: jest.fn(),
    });

    const phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu');
    const phoenixMenuUI = new PhoenixMenuUI(phoenixMenuRoot, three);
    phoenixMenuUI.addEventDataFolder();

    const ui = new UIManager(three);
    (ui as any).uiMenus = [phoenixMenuUI];

    const loader = new JiveXMLLoader();
    loader.process(xml);
    const eventData = loader.getEventData();
    loader.buildEventData(eventData, three, ui, new InfoLogger());

    const colorConfig = phoenixMenuRoot
      .findInTree('SomeTracks')
      ?.findInTree('Color Options')
      ?.configs.find((config) => config.label === 'Color');

    expect(colorConfig?.['color']).toBe(
      `#${EVENT_DATA_TYPE_COLORS.Tracks.getHexString()}`,
    );
  });
});
