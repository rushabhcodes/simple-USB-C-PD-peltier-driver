#include "tusb.h"
#include "pico/unique_id.h"
#include <string.h>
#include "usb_identity.h"
static char usb_serial[17];
void pd_usb_identity_init(void) { pico_get_unique_board_id_string(usb_serial, sizeof usb_serial); }
/* TinyUSB development VID/PID; allocate a product VID/PID before distribution. */
static const tusb_desc_device_t device = {
  .bLength = sizeof(tusb_desc_device_t), .bDescriptorType = TUSB_DESC_DEVICE,
  .bcdUSB = 0x0200, .bDeviceClass = TUSB_CLASS_MISC, .bDeviceSubClass = MISC_SUBCLASS_COMMON,
  .bDeviceProtocol = MISC_PROTOCOL_IAD, .bMaxPacketSize0 = CFG_TUD_ENDPOINT0_SIZE,
  .idVendor = 0xCAFE, .idProduct = 0x4001, .bcdDevice = 0x0100,
  .iManufacturer = 1, .iProduct = 2, .iSerialNumber = 3, .bNumConfigurations = 1
};
const uint8_t *tud_descriptor_device_cb(void) { return (const uint8_t *)&device; }
static const uint8_t configuration[] = {
  TUD_CONFIG_DESCRIPTOR(1, 2, 0, TUD_CONFIG_DESC_LEN + TUD_CDC_DESC_LEN,
    TUSB_DESC_CONFIG_ATT_SELF_POWERED, 100),
  TUD_CDC_DESCRIPTOR(0, 4, 0x81, 8, 0x02, 0x82, 64)
};
const uint8_t *tud_descriptor_configuration_cb(uint8_t index) { (void)index; return configuration; }
const uint16_t *tud_descriptor_string_cb(uint8_t index, uint16_t language) {
  (void)language;
  static uint16_t descriptor[33];
  const char *strings[] = {"", "0hmX", "USB-C Peltier PD Driver", "", "Control"};
  unsigned count;
  if (index == 0) { descriptor[1] = 0x0409; count = 1; }
  else {
    if (index >= sizeof strings / sizeof strings[0]) return NULL;
    const char *value = strings[index];
    if (index == 3) {
      value = usb_serial;
    }
    count = (unsigned)strlen(value); if (count > 32) count = 32;
    for (unsigned i = 0; i < count; ++i) descriptor[1 + i] = (uint8_t)value[i];
  }
  descriptor[0] = (uint16_t)((TUSB_DESC_STRING << 8) | (2 * count + 2));
  return descriptor;
}
