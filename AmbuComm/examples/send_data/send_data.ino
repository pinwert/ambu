#include <AmbuComm.h>

// Initializing Ambu to 9600 baudios
AmbuComm ambu(9600);

void setup() {}

void loop() {
  double angle = 0;
  unsigned long T = 5000;
  double steps = T/80.0;
  unsigned long _delay = T/steps;
  double deltaAngle = 2.0 * PI / steps;

  float pressure = 0;
  float volume = 0;
  float _time = 0;
  
  while (angle < 2 * PI) {
    pressure = float(sin(angle)*128+127);
    volume = float(sin(angle)*128+127);
    ambu.send(pressure, volume, _time, 12.2, 12.2);
    _time += _delay;
    angle += deltaAngle;
    delay(_delay);
  }    

}
