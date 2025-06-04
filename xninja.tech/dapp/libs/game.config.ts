export const CONFIG_BOOSTS: { [key: string]: any } = {
    1: { boost: 1, day: 7 },
    5: { boost: 1.5, day: 7 },
    10: { boost: 2, day: 7 },
    25: { boost: 3, day: 7 },
    50: { boost: 5, day: 7 },
    100: { boost: 12, day: 7 },
};

export const CONFIG_FOODS: { [key: string]: { price: number, mana: number, food: string, name: string, image: string } } = {
    rice: {
        price: 0.5,
        mana: 1,
        food: 'rice',
        name: 'Rice',
        image: '/assets/images/foods/rice.svg',
    },
    miso_soup: {
        price: 1,
        mana: 2,
        food: 'miso_soup',
        name: 'Miso soup',
        image: '/assets/images/foods/miso_soup.svg',
    },
    meat: {
        price: 1.5,
        mana: 3,
        food: 'meat',
        name: 'Meat',
        image: '/assets/images/foods/meat.svg',
    },
};

export const CONFIG_CHESTS: { [key: string]: { price: number, level: number, chest: string, name: string, image: string } } = {
    ninja_chest: {
        price: 0,
        level: 0,
        chest: 'ninja_chest',
        name: 'Ninja Chest',
        image: '/assets/images/chest.svg',
    },
    warrior_chest: {
        price: 276,
        level: 5,
        chest: 'warrior_chest',
        name: 'Warrior Chest',
        image: '/assets/images/chest.svg',
    },
    knight_chest: {
        price: 3420,
        level: 16,
        chest: 'knight_chest',
        name: 'Knight Chest',
        image: '/assets/images/chest.svg',
    },
    lord_chest: {
        price: 36288,
        level: 30,
        chest: 'lord_chest',
        name: 'Lord Chest',
        image: '/assets/images/chest.svg',
    },
    master_chest: {
        price: 253911,
        level: 50,
        chest: 'master_chest',
        name: 'Master Chest',
        image: '/assets/images/chest.svg',
    },
};

export const MANA_CLASSES: { [key: string]: number } = {
    metal: 5,
    wood: 4,
    fire: 4,
    water: 3,
    earth: 3,
};

export const LEVEL_NINJAS: { [key: string]: { [key: number]: { cost: number, farm_speed_hour: number } } } = {
    metal: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
        },
        5: {
            cost: 110,
            farm_speed_hour: 0.1402,
        },
        6: {
            cost: 130,
            farm_speed_hour: 0.2386,
        },
        7: {
            cost: 150,
            farm_speed_hour: 0.3588,
        },
        8: {
            cost: 175,
            farm_speed_hour: 0.4938,
        },
        9: {
            cost: 200,
            farm_speed_hour: 0.6604,
        },
        10: {
            cost: 230,
            farm_speed_hour: 0.8412,
        },
        11: {
            cost: 250,
            farm_speed_hour: 1.0577,
        },
        12: {
            cost: 270,
            farm_speed_hour: 1.274,
        },
        13: {
            cost: 320,
            farm_speed_hour: 1.5605,
        },
        14: {
            cost: 380,
            farm_speed_hour: 1.8709,
        },
        15: {
            cost: 460,
            farm_speed_hour: 2.2917,
        },
        16: {
            cost: 750,
            farm_speed_hour: 2.9762,
        },
        17: {
            cost: 900,
            farm_speed_hour: 3.8194,
        },
        18: {
            cost: 990,
            farm_speed_hour: 4.6788,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 5.8687,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 6.9537,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 8.5176,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 9.8902,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 12.8314,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 15.5487,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 18.9898,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 22.3579,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 27.3993,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 31.6837,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 38.3639,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 43.8282,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 52.2255,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 58.5898,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 67.3886,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 75.0302,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 85.8069,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 94.9902,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 108.1866,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 119.2327,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 135.3936,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 148.6934,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 168.9971,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 185.4186,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 210.1592,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 230.1572,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 261.1605,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 296.8232,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 337.0055,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 369.2234,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 421.8549,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 465.0182,
        },
    },
    fire: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
        },
        5: {
            cost: 110,
            farm_speed_hour: 0.1329,
        },
        6: {
            cost: 130,
            farm_speed_hour: 0.2303,
        },
        7: {
            cost: 150,
            farm_speed_hour: 0.3399,
        },
        8: {
            cost: 175,
            farm_speed_hour: 0.4762,
        },
        9: {
            cost: 200,
            farm_speed_hour: 0.6364,
        },
        10: {
            cost: 230,
            farm_speed_hour: 0.8106,
        },
        11: {
            cost: 250,
            farm_speed_hour: 1.0185,
        },
        12: {
            cost: 270,
            farm_speed_hour: 1.2269,
        },
        13: {
            cost: 320,
            farm_speed_hour: 1.5016,
        },
        14: {
            cost: 380,
            farm_speed_hour: 1.8003,
        },
        15: {
            cost: 460,
            farm_speed_hour: 2.2035,
        },
        16: {
            cost: 750,
            farm_speed_hour: 2.8595,
        },
        17: {
            cost: 900,
            farm_speed_hour: 3.6667,
        },
        18: {
            cost: 990,
            farm_speed_hour: 4.4917,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 5.5094,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 6.6640,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 7.9739,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 9.4602,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 11.9760,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 15.1871,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 18.5376,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 21.8255,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 26.0628,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 30.1381,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 35.4866,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 41.5806,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 48.1024,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 53.9643,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 61.9247,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 68.9467,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 78.6563,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 87.0744,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 98.9134,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 109.0128,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 123.4471,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 135.5734,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 153.6337,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 168.5624,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 190.4567,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 208.5799,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 235.8869,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 267.1409,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 292.0714,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 331.0279,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 376.6562,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 430.5724,
        },
    },
    wood: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
        },
        5: {
            cost: 110,
            farm_speed_hour: 0.1306,
        },
        6: {
            cost: 130,
            farm_speed_hour: 0.2263,
        },
        7: {
            cost: 150,
            farm_speed_hour: 0.3341,
        },
        8: {
            cost: 175,
            farm_speed_hour: 0.4678,
        },
        9: {
            cost: 200,
            farm_speed_hour: 0.6140,
        },
        10: {
            cost: 230,
            farm_speed_hour: 0.7961,
        },
        11: {
            cost: 250,
            farm_speed_hour: 1.9821,
        },
        12: {
            cost: 270,
            farm_speed_hour: 1.2045,
        },
        13: {
            cost: 320,
            farm_speed_hour: 1.4470,
        },
        14: {
            cost: 380,
            farm_speed_hour: 1.7670,
        },
        15: {
            cost: 460,
            farm_speed_hour: 2.1619,
        },
        16: {
            cost: 750,
            farm_speed_hour: 2.8045,
        },
        17: {
            cost: 900,
            farm_speed_hour: 3.5948,
        },
        18: {
            cost: 990,
            farm_speed_hour: 4.4036,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 5.3992,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 6.3974,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 7.6485,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 8.8810,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 11.2275,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 13.8945,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 16.5656,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 19.9277,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 23.7461,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 28.0833,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 33.0108,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 39.5522,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 45.6973,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 51.2661,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 58.7490,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 65.4110,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 74.5165,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 82.4915,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 93.5668,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 103.1202,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 116.5889,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 128.0415,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 153.6337,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 168.5624,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 190.4567,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 208.5799,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 235.8869,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 267.1409,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 292.0714,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 331.0279,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 363.6680,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 415.1948,
        },
    },
    water: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
        },
        5: {
            cost: 110,
            farm_speed_hour: 0.1264,
        },
        6: {
            cost: 130,
            farm_speed_hour: 0.2188,
        },
        7: {
            cost: 150,
            farm_speed_hour: 0.3229,
        },
        8: {
            cost: 175,
            farm_speed_hour: 0.4520,
        },
        9: {
            cost: 200,
            farm_speed_hour: 0.5932,
        },
        10: {
            cost: 230,
            farm_speed_hour: 0.7687,
        },
        11: {
            cost: 250,
            farm_speed_hour: 0.9483,
        },
        12: {
            cost: 270,
            farm_speed_hour: 1.1623,
        },
        13: {
            cost: 320,
            farm_speed_hour: 1.3962,
        },
        14: {
            cost: 380,
            farm_speed_hour: 1.7039,
        },
        15: {
            cost: 460,
            farm_speed_hour: 2.0461,
        },
        16: {
            cost: 750,
            farm_speed_hour: 2.7006,
        },
        17: {
            cost: 900,
            farm_speed_hour: 3.4591,
        },
        18: {
            cost: 990,
            farm_speed_hour: 4.2374,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 5.1915,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 6.1514,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 7.3485,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 8.5327,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 10.7784,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 13.3274,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 16.2204,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 19.5037,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 23.2298,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 27.4592,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 32.2605,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 37.7126,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 42.5091,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 48.8248,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 54.5527,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 62.2202,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 69.0641,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 78.3669,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 86.5493,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 97.8320,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 107.6205,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 121.3025,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 133.4187,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 150.3395,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 164.7193,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 185.4044,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 203.1249,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 228.9779,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 257.7101,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 290.9033,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 329.5741,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 375.0147,
        },
    },
    earth: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
        },
        5: {
            cost: 110,
            farm_speed_hour: 0.1224,
        },
        6: {
            cost: 130,
            farm_speed_hour: 0.2117,
        },
        7: {
            cost: 150,
            farm_speed_hour: 0.3125,
        },
        8: {
            cost: 175,
            farm_speed_hour: 0.4372,
        },
        9: {
            cost: 200,
            farm_speed_hour: 0.5833,
        },
        10: {
            cost: 230,
            farm_speed_hour: 0.7431,
        },
        11: {
            cost: 250,
            farm_speed_hour: 0.9322,
        },
        12: {
            cost: 270,
            farm_speed_hour: 1.1229,
        },
        13: {
            cost: 320,
            farm_speed_hour: 1.3721,
        },
        14: {
            cost: 380,
            farm_speed_hour: 1.6451,
        },
        15: {
            cost: 460,
            farm_speed_hour: 2.0102,
        },
        16: {
            cost: 750,
            farm_speed_hour: 2.6042,
        },
        17: {
            cost: 900,
            farm_speed_hour: 3.3333,
        },
        18: {
            cost: 990,
            farm_speed_hour: 4.0833,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 4.9992,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 5.9235,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 7.0712,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 8.2107,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 10.3638,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 12.5585,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 15.2663,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 18.3334,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 21.8076,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 25.7430,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 30.2013,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 36.0365,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 41.5430,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 46.6055,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 53.2840,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 59.3262,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 67.4197,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 74.6352,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 84.4383,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 93.0597,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 104.9300,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 115.2374,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 129.9978,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 142.6297,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 160.3846,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 175.6463,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 197.6350,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 216.6007,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 243.3928,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 274.2803,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 310.1874,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 352.2865,
        },
    }
};