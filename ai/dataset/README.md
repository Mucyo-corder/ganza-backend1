GANZA Vision Dataset

GANZA is a general-purpose object recognition and measurement system.
Wood/timber is a priority domain, but the model must recognize other
objects so that non-inventory objects are not incorrectly classified as wood.

Primary categories:
0 timber_board
1 plank
2 wood_beam
3 wood_post
4 wood_panel
5 wood_log
6 wood_furniture
7 construction_material
8 hand_tool
9 power_tool
10 machine
11 metal
12 pipe
13 electrical_equipment
14 electronic_device
15 furniture
16 vehicle
17 office_item
18 household_item
19 packaging
20 agricultural_equipment
21 other_supported_object
22 unknown

Important:
- Never classify an object as timber only because it has a rectangular shape.
- Unsupported or low-confidence objects must be rejected or sent for review.
- Multiple objects must be detected individually.
- Physical dimensions require a known scale/reference or another valid measurement source.
- Store confidence and detection metadata.
- Public datasets are only starting data; GANZA-specific real-world images will be added later.
