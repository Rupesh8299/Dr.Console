from modules.image_analysis.vision_agent import VisionAgent

tests = [
    ('my ear is hurting badly', 'ear'),
    ('my eye is red and itchy', 'eye'),
    ('look at my tongue', 'tongue'),
    ('I have a rash on my arm', 'skin'),
    ('please analyze this photo', 'skin'),
    ('I have tinnitus and ear discharge', 'ear'),
    ('cataract check please', 'eye'),
]

all_pass = True
for msg, expected in tests:
    result = VisionAgent.auto_detect_specialist(msg)
    status = 'PASS' if result == expected else 'FAIL'
    if status == 'FAIL':
        all_pass = False
    print(f'{status}: "{msg}" -> {result} (expected: {expected})')

print()
print('All tests passed!' if all_pass else 'Some tests FAILED!')
