import { EventDataLoader } from '../../event-data-loader';
import { UIService } from '../../ui.service';
import { ThreeService } from '../../three.service';
import { CMSEventDescription } from './event-description';

export class CMSLoader implements EventDataLoader {

    eventData: any;
    loadedCollections: string[] = [];

    public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void {
        this.eventData = eventData;
        // Mapping of the collections to parse from the event data file
        const eventDescription = new CMSEventDescription();
        const eventDataFolder = ui.getEventDataFolder();
        for (const collectionDescription of eventDescription.collections) {
            const collectionData = eventData.Collections[collectionDescription.key];
            if (collectionData) {
                const collectionGeometry = collectionDescription.getObject(collectionData);
                const group = graphicsLibrary.getSceneManager().getEventData();
                group.add(collectionGeometry);
                ui.addCollection(eventDataFolder, collectionDescription.name);
                this.loadedCollections.push(collectionDescription.name);
            }
        }
    }
    public getEventsList(eventsData: any): string[] {
        const eventsList: string[] = [];

        for (const eventName of Object.keys(eventsData)) {
            if (eventsData[eventName] !== null) {
                eventsList.push(eventName);
            }
        }

        return eventsList;
    }
    public getCollections(): string[] {
        return this.loadedCollections;
    }
    public getCollection(collectionName: string) {
        console.log('Method not implemented.');
    }

    public getEventMetadata(): string[] {
        const metadata = [];
        if (this.eventData && this.eventData.Collections) {
            const data = this.eventData.Collections.Event_V2;
            if (data) {
                const ei = data[0];
                const run = ei[0];
                const event = ei[1];
                const ls = ei[2];
                const time = ei[5];
                metadata.push('CMS Experiment at the LHC, CERN');
                metadata.push('Data recorded: ' + time);
                metadata.push('Run / Event / LS: ' + run + ' / ' + event + ' / ' + ls);
            }
        }
        return metadata;
    }

}
