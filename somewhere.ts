const MINIMUM_UPDATE_THRESHOLD = 24 * 60 * 60 * 1000;
const LOG_FILE_NAME = "somewhere.json";
const LOCATION_DECIMAL_PLACES = 2;

interface Location {
  lat: number;
  lng: number;
}

interface LocationLog extends Location {
  timestamp: number;
}

interface LogFile {
  locations: LocationLog[];
}

function round(value: number, decimalPlaces: number) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

const fetchLocationCommand = new Deno.Command("shortcuts", {
  args: ["run", "somewhere-location"],
  stdout: "piped",
});

async function fetchLocation(): Promise<Location> {
  const output = await fetchLocationCommand.output();
  const locationUint8 = output.stdout;
  const locationString = new TextDecoder().decode(locationUint8);
  const [latString, lngString] = locationString.split(",");
  const lat = round(parseFloat(latString), LOCATION_DECIMAL_PLACES);
  const lng = round(parseFloat(lngString), LOCATION_DECIMAL_PLACES);
  return { lat, lng };
}

async function readPreviousLocations(): Promise<LocationLog[] | null> {
  const fileExists = await Deno.stat(LOG_FILE_NAME).catch(() => false);

  if (!fileExists) {
    return null;
  }

  const logFileContent = await Deno.readTextFile(LOG_FILE_NAME);
  const logFile: LogFile = JSON.parse(logFileContent);
  return logFile.locations;
}

interface WriteLocationOptions {
  previousLocations: LocationLog[] | null;
  location: Location;
}

async function writeLocation(options: WriteLocationOptions) {
  const { previousLocations, location } = options;

  const newLocationLog: LocationLog = {
    ...location,
    timestamp: Date.now(),
  };

  const newLocations = [
    newLocationLog,
    ...(previousLocations || []),
  ];

  const newLogFile: LogFile = { locations: newLocations };
  const newLogFileContent = JSON.stringify(newLogFile);
  await Deno.writeTextFile(LOG_FILE_NAME, newLogFileContent);
}

async function main() {
  const previousLocations = await readPreviousLocations();
  const location = await fetchLocation();

  if (previousLocations) {
    const lastLocation = previousLocations[0];

    const timeSinceLastUpdate = Date.now() - lastLocation.timestamp;

    if (timeSinceLastUpdate < MINIMUM_UPDATE_THRESHOLD) {
      console.log(
        `Update threshold not met (${timeSinceLastUpdate}ms, needed ${MINIMUM_UPDATE_THRESHOLD}ms)`,
      );
      return;
    }

    if (
      location.lat === lastLocation.lat && location.lng === lastLocation.lng
    ) {
      console.log("Location has not changed");
      return;
    }
  }

  await writeLocation({ previousLocations, location });
  console.log(`Location updated (${location.lat}, ${location.lng})`);
}

await main();
