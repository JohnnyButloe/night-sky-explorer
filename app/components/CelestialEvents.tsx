import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CelestialObject {
  name: string;
  rightAscension: string;
  declination: string;
}

interface CelestialEventsProps {
  data: {
    planets: CelestialObject[];
    stars: CelestialObject[];
    events: string[];
  };
}

export default function CelestialEvents({ data }: CelestialEventsProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Celestial Events and Objects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Visible Planets</h3>
            <ul className="space-y-2">
              {data.planets.map((planet, index) => (
                <li key={index}>
                  <span className="font-medium">{planet.name}</span>
                  <br />
                  <span className="text-sm text-gray-600">
                    RA: {planet.rightAscension}, Dec: {planet.declination}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Notable Stars</h3>
            <ul className="space-y-2">
              {data.stars.map((star, index) => (
                <li key={index}>
                  <span className="font-medium">{star.name}</span>
                  <br />
                  <span className="text-sm text-gray-600">
                    RA: {star.rightAscension}, Dec: {star.declination}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Celestial Events</h3>
            <ul className="list-disc list-inside">
              {data.events.map((event, index) => (
                <li key={index}>{event}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
