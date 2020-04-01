/*
  AmbuComm.h - Library for communicating with AmbuApp
  Created by Enrique Piña Monserrat, March 28, 2020
  Released into the public domain.
*/
#ifndef AmbuComm_h
#define AmbuComm_h

#include "Arduino.h"

class AmbuComm
{
public:
    AmbuComm(int baudios);
    void send(float pressure, float time, float volume, float ie, float frequency);
};

#endif