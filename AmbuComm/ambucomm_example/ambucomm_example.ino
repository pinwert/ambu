#include <AmbuComm.h>

AmbuComm ambu(9600);

void setup() {
}

void loop() {
  ambu.send(12.2, 12.2, 12.2, 12.2);
}
