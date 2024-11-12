# somewhere

A command-line tool for macOS that collects your device location once per day,
and updates a JSON file with it when it changes.

## Usage

```
$ deno run -A http://deno.land/x/somewhere/somewhere.ts
```

Setting a cron job or other method to run this regularly is left as an exercise
to the reader.

## Output

Creates a file named `somewhere.json` in the current working directory, with the
format:

```json
{
  "locations": [
    {
      "lat": 42.39,
      "lng": -83.09,
      "timestamp": 1714703163069
    }
  ]
}
```

Locations are listed in descending order. The JSON file is not updated if the
location hasn't changed since last run, or if the most recent location is < 24
hours old.

## Dependencies

- Relies on a tiny macOS Shortcut to retrieve the device location; see `./somewhere-location.shortcut`.
  Simpler and caused fewer headaches than signing the app for CoreLocation access.
- deno ~1.41.3

## Todo list

- Three options are configurable in code; the minimum update threshold, the log
  file name, and the location precision. It would probably be nice to make these
  command-line options.
- Preserving a bit of location privacy is just based on rounding to two decimal
  places right now, which makes it far more/less specific depending on the
  distance from the equator. Should probably use actual distance instead.
- The heuristic for "has the location changed" is simply "are the location
  values the same". If your location falls on a border where e.g. your device
  may report 42.39° or 42.40° latitude at different times, this will probably
  cause frequent updates. Similar to the above point, should probably use an
  actual distance threshold.

## License

MIT
