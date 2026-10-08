import launchesData from '../launches.json';
import launchpadsData from '../launchpads.json';

class SpaceX {
    launches() { return Promise.resolve(launchesData); }
    launchpads() { return Promise.resolve(launchpadsData); }
    launchpad(id) { return Promise.resolve(launchpadsData.find(p => p.id === id)); }}

export { SpaceX };