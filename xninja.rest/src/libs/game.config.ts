export const CONFIG_BOOSTS: { [key: string]: any } = {
    1: { boost: 50, day: 21 },
    5: { boost: 60, day: 21 },
    10: { boost: 70, day: 21 },
    25: { boost: 80, day: 21 },
    50: { boost: 100, day: 21 },
    100: { boost: 125, day: 21 },
};

export const CONFIG_FOODS: { [key: string]: { price: number; mana: number; food: string; name: string; image: string } } = {
    rice: {
        price: 0.5,
        mana: 1,
        food: 'rice',
        name: 'Rice',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/foods/rice.svg',
    },
    miso_soup: {
        price: 1,
        mana: 2,
        food: 'miso_soup',
        name: 'Miso soup',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/foods/miso_soup.svg',
    },
    meat: {
        price: 1.5,
        mana: 3,
        food: 'meat',
        name: 'Meat',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/foods/meat.svg',
    },
};

export const CONFIG_MANA_CLASSES = {
    metal: 5,
    wood: 4,
    fire: 4,
    water: 3,
    earth: 3,
};

export type MANA_CLASSES = 'metal' | 'wood' | 'fire' | 'water' | 'earth';
export type CHESTS = { chest: string };

export const CONFIG_CHESTS: { [key: string]: { price: number; level: number; chest: string; name: string; image: string; classes: MANA_CLASSES[] } } = {
    chest_lv_0: {
        price: 0,
        level: 0,
        chest: 'chest_lv_0',
        name: 'Chest LV 0',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
    chest_lv_5: {
        price: 295,
        level: 5,
        chest: 'chest_lv_5',
        name: 'Chest LV 5',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
    chest_lv_7: {
        price: 645,
        level: 7,
        chest: 'chest_lv_7',
        name: 'Chest LV 7',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
    chest_lv_9: {
        price: 1175,
        level: 9,
        chest: 'chest_lv_9',
        name: 'Chest LV 9',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
    chest_lv_13: {
        price: 2860,
        level: 13,
        chest: 'chest_lv_13',
        name: 'Chest LV 13',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
    chest_lv_17: {
        price: 5690,
        level: 17,
        chest: 'chest_lv_17',
        name: 'Chest LV 17',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
    chest_lv_19: {
        price: 7769,
        level: 19,
        chest: 'chest_lv_19',
        name: 'Chest LV 19',
        image: 'https://xninja.s3.ap-southeast-1.amazonaws.com/images/chest.svg',
        classes: ['metal', 'wood', 'fire', 'water', 'earth'],
    },
};

export const MANA_CLASSES: { [key: string]: number } = {
    metal: 5,
    wood: 4,
    fire: 4,
    water: 3,
    earth: 3,
};

export const LEVEL_NINJAS: { [key: string]: { [key: number]: { cost: number; farm_speed_hour: number; APR: number } } } = {
    metal: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
            APR: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
            APR: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
            APR: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
            APR: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
            APR: 0,
        },
        5: {
            cost: 120,
            farm_speed_hour: 0.1343,
            APR: 398.68,
        },
        6: {
            cost: 155,
            farm_speed_hour: 0.2778,
            APR: 540.74,
        },
        7: {
            cost: 195,
            farm_speed_hour: 0.4583,
            APR: 622.48,
        },
        8: {
            cost: 240,
            farm_speed_hour: 0.6806,
            APR: 673.63,
        },
        9: {
            cost: 290,
            farm_speed_hour: 0.9491,
            APR: 707.57,
        },
        10: {
            cost: 340,
            farm_speed_hour: 1.2639,
            APR: 730.80,
        },
        11: {
            cost: 395,
            farm_speed_hour: 1.6296,
            APR: 747.41,
        },
        12: {
            cost: 450,
            farm_speed_hour: 2.0463,
            APR: 759.56,
        },
        13: {
            cost: 500,
            farm_speed_hour: 2.5093,
            APR: 768.57,
        },
        14: {
            cost: 560,
            farm_speed_hour: 3.0278,
            APR: 775.54,
        },
        15: {
            cost: 620,
            farm_speed_hour: 3.6019,
            APR: 781.00,
        },
        16: {
            cost: 750,
            farm_speed_hour: 4.2963,
            APR: 785.71,
        },
        17: {
            cost: 900,
            farm_speed_hour: 5.1296,
            APR: 789.73,
        },
        18: {
            cost: 990,
            farm_speed_hour: 6.0463,
            APR: 792.90,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 7.0546,
            APR: 795.45,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 8.1638,
            APR: 797.54,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 9.3839,
            APR: 799.28,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 10.7260,
            APR: 800.74,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 13.0315,
            APR: 802.56,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 15.5676,
            APR: 803.94,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 18.3574,
            APR: 805.02,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 21.4261,
            APR: 805.89,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 24.8016,
            APR: 806.59,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 28.5147,
            APR: 807.18,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 32.5992,
            APR: 807.67,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 37.0920,
            APR: 808.09,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 41.6754,
            APR: 808.42,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 46.6254,
            APR: 808.70,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 51.9714,
            APR: 808.95,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 57.7451,
            APR: 809.16,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 63.9806,
            APR: 809.35,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 70.7151,
            APR: 809.52,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 77.9882,
            APR: 809.67,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 85.8433,
            APR: 809.80,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 94.3267,
            APR: 809.92,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 103.4888,
            APR: 810.02,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 113.7203,
            APR: 810.12,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 124.6680,
            APR: 810.21,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 136.4915,
            APR: 810.29,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 149.3791,
            APR: 810.36,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 163.5554,
            APR: 810.42,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 179.1495,
            APR: 810.48,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 195.7698,
            APR: 810.54,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 214.3846,
            APR: 810.59,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 235.4194,
            APR: 810.63,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 259.3990,
            APR: 810.68,
        },
    },
    fire: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
            APR: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
            APR: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
            APR: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
            APR: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
            APR: 0,
        },
        5: {
            cost: 120,
            farm_speed_hour: 0.1221,
            APR: 362.44,
        },
        6: {
            cost: 155,
            farm_speed_hour: 0.2525,
            APR: 491.58,
        },
        7: {
            cost: 195,
            farm_speed_hour: 0.4167,
            APR: 565.89,
        },
        8: {
            cost: 240,
            farm_speed_hour: 0.6187,
            APR: 612.40,
        },
        9: {
            cost: 290,
            farm_speed_hour: 0.8628,
            APR: 643.24,
        },
        10: {
            cost: 340,
            farm_speed_hour: 1.1490,
            APR: 664.37,
        },
        11: {
            cost: 395,
            farm_speed_hour: 1.4815,
            APR: 679.46,
        },
        12: {
            cost: 450,
            farm_speed_hour: 1.8603,
            APR: 690.51,
        },
        13: {
            cost: 500,
            farm_speed_hour: 2.2811,
            APR: 698.70,
        },
        14: {
            cost: 560,
            farm_speed_hour: 2.7525,
            APR: 705.03,
        },
        15: {
            cost: 620,
            farm_speed_hour: 3.2744,
            APR: 710.00,
        },
        16: {
            cost: 750,
            farm_speed_hour: 3.9057,
            APR: 714.28,
        },
        17: {
            cost: 900,
            farm_speed_hour: 4.6633,
            APR: 717.94,
        },
        18: {
            cost: 990,
            farm_speed_hour: 5.4966,
            APR: 720.82,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 6.4133,
            APR: 723.14,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 7.4216,
            APR: 725.04,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 8.5308,
            APR: 726.62,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 9.7509,
            APR: 727.95,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 11.8468,
            APR: 729.60,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 14.1524,
            APR: 730.85,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 16.6885,
            APR: 731.84,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 19.4782,
            APR: 732.62,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 22.5469,
            APR: 733.27,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 25.9225,
            APR: 733.80,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 29.6356,
            APR: 734.25,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 33.7200,
            APR: 734.62,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 37.8867,
            APR: 734.92,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 42.3867,
            APR: 735.18,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 47.2467,
            APR: 735.41,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 52.4955,
            APR: 735.60,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 58.1642,
            APR: 735.78,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 64.2864,
            APR: 735.93,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 70.8984,
            APR: 736.06,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 78.0393,
            APR: 736.18,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 85.7515,
            APR: 736.29,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 94.0807,
            APR: 736.39,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 103.3821,
            APR: 736.47,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 113.3345,
            APR: 736.55,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 124.0831,
            APR: 736.62,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 135.7992,
            APR: 736.69,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 148.8686,
            APR: 736.75,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 162.8631,
            APR: 736.80,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 177.9726,
            APR: 736.85,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 194.8951,
            APR: 736.90,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 214.0176,
            APR: 736.94,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 235.8173,
            APR: 736.98,
        },
    },
    wood: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
            APR: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
            APR: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
            APR: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
            APR: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
            APR: 0,
        },
        5: {
            cost: 120,
            farm_speed_hour: 0.1221,
            APR: 362.44,
        },
        6: {
            cost: 155,
            farm_speed_hour: 0.2525,
            APR: 491.58,
        },
        7: {
            cost: 195,
            farm_speed_hour: 0.4167,
            APR: 565.89,
        },
        8: {
            cost: 240,
            farm_speed_hour: 0.6187,
            APR: 612.40,
        },
        9: {
            cost: 290,
            farm_speed_hour: 0.8628,
            APR: 643.24,
        },
        10: {
            cost: 340,
            farm_speed_hour: 1.1490,
            APR: 664.37,
        },
        11: {
            cost: 395,
            farm_speed_hour: 1.4815,
            APR: 679.46,
        },
        12: {
            cost: 450,
            farm_speed_hour: 1.8603,
            APR: 690.51,
        },
        13: {
            cost: 500,
            farm_speed_hour: 2.2811,
            APR: 698.70,
        },
        14: {
            cost: 560,
            farm_speed_hour: 2.7525,
            APR: 705.03,
        },
        15: {
            cost: 620,
            farm_speed_hour: 3.2744,
            APR: 710.00,
        },
        16: {
            cost: 750,
            farm_speed_hour: 3.9057,
            APR: 714.28,
        },
        17: {
            cost: 900,
            farm_speed_hour: 4.6633,
            APR: 717.94,
        },
        18: {
            cost: 990,
            farm_speed_hour: 5.4966,
            APR: 720.82,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 6.4133,
            APR: 723.14,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 7.4216,
            APR: 725.04,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 8.5308,
            APR: 726.62,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 9.7509,
            APR: 727.95,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 11.8468,
            APR: 729.60,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 14.1524,
            APR: 730.85,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 16.6885,
            APR: 731.84,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 19.4782,
            APR: 732.62,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 22.5469,
            APR: 733.27,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 25.9225,
            APR: 733.80,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 29.6356,
            APR: 734.25,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 33.7200,
            APR: 734.62,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 37.8867,
            APR: 734.92,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 42.3867,
            APR: 735.18,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 47.2467,
            APR: 735.41,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 52.4955,
            APR: 735.60,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 58.1642,
            APR: 735.78,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 64.2864,
            APR: 735.93,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 70.8984,
            APR: 736.06,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 78.0393,
            APR: 736.18,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 85.7515,
            APR: 736.29,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 94.0807,
            APR: 736.39,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 103.3821,
            APR: 736.47,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 113.3345,
            APR: 736.55,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 124.0831,
            APR: 736.62,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 135.7992,
            APR: 736.69,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 148.8686,
            APR: 736.75,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 162.8631,
            APR: 736.80,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 177.9726,
            APR: 736.85,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 194.8951,
            APR: 736.90,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 214.0176,
            APR: 736.94,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 235.8173,
            APR: 736.98,
        },
    },
    water: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
            APR: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
            APR: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
            APR: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
            APR: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
            APR: 0,
        },
        5: {
            cost: 120,
            farm_speed_hour: 0.1221,
            APR: 362.44,
        },
        6: {
            cost: 155,
            farm_speed_hour: 0.2525,
            APR: 491.58,
        },
        7: {
            cost: 195,
            farm_speed_hour: 0.4167,
            APR: 565.89,
        },
        8: {
            cost: 240,
            farm_speed_hour: 0.6187,
            APR: 612.40,
        },
        9: {
            cost: 290,
            farm_speed_hour: 0.8628,
            APR: 643.24,
        },
        10: {
            cost: 340,
            farm_speed_hour: 1.1490,
            APR: 664.37,
        },
        11: {
            cost: 395,
            farm_speed_hour: 1.4815,
            APR: 679.46,
        },
        12: {
            cost: 450,
            farm_speed_hour: 1.8603,
            APR: 690.51,
        },
        13: {
            cost: 500,
            farm_speed_hour: 2.2811,
            APR: 698.70,
        },
        14: {
            cost: 560,
            farm_speed_hour: 2.7525,
            APR: 705.03,
        },
        15: {
            cost: 620,
            farm_speed_hour: 3.2744,
            APR: 710.00,
        },
        16: {
            cost: 750,
            farm_speed_hour: 3.9057,
            APR: 714.28,
        },
        17: {
            cost: 900,
            farm_speed_hour: 4.6633,
            APR: 717.94,
        },
        18: {
            cost: 990,
            farm_speed_hour: 5.4966,
            APR: 720.82,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 6.4133,
            APR: 723.14,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 7.4216,
            APR: 725.04,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 8.5308,
            APR: 726.62,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 9.7509,
            APR: 727.95,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 11.8468,
            APR: 729.60,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 14.1524,
            APR: 730.85,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 16.6885,
            APR: 731.84,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 19.4782,
            APR: 732.62,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 22.5469,
            APR: 733.27,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 25.9225,
            APR: 733.80,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 29.6356,
            APR: 734.25,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 33.7200,
            APR: 734.62,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 37.8867,
            APR: 734.92,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 42.3867,
            APR: 735.18,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 47.2467,
            APR: 735.41,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 52.4955,
            APR: 735.60,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 58.1642,
            APR: 735.78,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 64.2864,
            APR: 735.93,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 70.8984,
            APR: 736.06,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 78.0393,
            APR: 736.18,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 85.7515,
            APR: 736.29,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 94.0807,
            APR: 736.39,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 103.3821,
            APR: 736.47,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 113.3345,
            APR: 736.55,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 124.0831,
            APR: 736.62,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 135.7992,
            APR: 736.69,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 148.8686,
            APR: 736.75,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 162.8631,
            APR: 736.80,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 177.9726,
            APR: 736.85,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 194.8951,
            APR: 736.90,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 214.0176,
            APR: 736.94,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 235.8173,
            APR: 736.98,
        },
    },
    earth: {
        0: {
            cost: 0,
            farm_speed_hour: 0,
            APR: 0,
        },
        1: {
            cost: 10,
            farm_speed_hour: 0,
            APR: 0,
        },
        2: {
            cost: 25,
            farm_speed_hour: 0,
            APR: 0,
        },
        3: {
            cost: 50,
            farm_speed_hour: 0,
            APR: 0,
        },
        4: {
            cost: 90,
            farm_speed_hour: 0,
            APR: 0,
        },
        5: {
            cost: 120,
            farm_speed_hour: 0.1221,
            APR: 362.44,
        },
        6: {
            cost: 155,
            farm_speed_hour: 0.2525,
            APR: 491.58,
        },
        7: {
            cost: 195,
            farm_speed_hour: 0.4167,
            APR: 565.89,
        },
        8: {
            cost: 240,
            farm_speed_hour: 0.6187,
            APR: 612.40,
        },
        9: {
            cost: 290,
            farm_speed_hour: 0.8628,
            APR: 643.24,
        },
        10: {
            cost: 340,
            farm_speed_hour: 1.1490,
            APR: 664.37,
        },
        11: {
            cost: 395,
            farm_speed_hour: 1.4815,
            APR: 679.46,
        },
        12: {
            cost: 450,
            farm_speed_hour: 1.8603,
            APR: 690.51,
        },
        13: {
            cost: 500,
            farm_speed_hour: 2.2811,
            APR: 698.70,
        },
        14: {
            cost: 560,
            farm_speed_hour: 2.7525,
            APR: 705.03,
        },
        15: {
            cost: 620,
            farm_speed_hour: 3.2744,
            APR: 710.00,
        },
        16: {
            cost: 750,
            farm_speed_hour: 3.9057,
            APR: 714.28,
        },
        17: {
            cost: 900,
            farm_speed_hour: 4.6633,
            APR: 717.94,
        },
        18: {
            cost: 990,
            farm_speed_hour: 5.4966,
            APR: 720.82,
        },
        19: {
            cost: 1089,
            farm_speed_hour: 6.4133,
            APR: 723.14,
        },
        20: {
            cost: 1198,
            farm_speed_hour: 7.4216,
            APR: 725.04,
        },
        21: {
            cost: 1318,
            farm_speed_hour: 8.5308,
            APR: 726.62,
        },
        22: {
            cost: 1449,
            farm_speed_hour: 9.7509,
            APR: 727.95,
        },
        23: {
            cost: 2490,
            farm_speed_hour: 11.8468,
            APR: 729.60,
        },
        24: {
            cost: 2739,
            farm_speed_hour: 14.1524,
            APR: 730.85,
        },
        25: {
            cost: 3013,
            farm_speed_hour: 16.6885,
            APR: 731.84,
        },
        26: {
            cost: 3314,
            farm_speed_hour: 19.4782,
            APR: 732.62,
        },
        27: {
            cost: 3646,
            farm_speed_hour: 22.5469,
            APR: 733.27,
        },
        28: {
            cost: 4010,
            farm_speed_hour: 25.9225,
            APR: 733.80,
        },
        29: {
            cost: 4411,
            farm_speed_hour: 29.6356,
            APR: 734.25,
        },
        30: {
            cost: 4852,
            farm_speed_hour: 33.7200,
            APR: 734.62,
        },
        31: {
            cost: 4950,
            farm_speed_hour: 37.8867,
            APR: 734.92,
        },
        32: {
            cost: 5346,
            farm_speed_hour: 42.3867,
            APR: 735.18,
        },
        33: {
            cost: 5774,
            farm_speed_hour: 47.2467,
            APR: 735.41,
        },
        34: {
            cost: 6236,
            farm_speed_hour: 52.4955,
            APR: 735.60,
        },
        35: {
            cost: 6734,
            farm_speed_hour: 58.1642,
            APR: 735.78,
        },
        36: {
            cost: 7273,
            farm_speed_hour: 64.2864,
            APR: 735.93,
        },
        37: {
            cost: 7855,
            farm_speed_hour: 70.8984,
            APR: 736.06,
        },
        38: {
            cost: 8483,
            farm_speed_hour: 78.0393,
            APR: 736.18,
        },
        39: {
            cost: 9162,
            farm_speed_hour: 85.7515,
            APR: 736.29,
        },
        40: {
            cost: 9895,
            farm_speed_hour: 94.0807,
            APR: 736.39,
        },
        41: {
            cost: 11050,
            farm_speed_hour: 103.3821,
            APR: 736.47,
        },
        42: {
            cost: 11824,
            farm_speed_hour: 113.3345,
            APR: 736.55,
        },
        43: {
            cost: 12769,
            farm_speed_hour: 124.0831,
            APR: 736.62,
        },
        44: {
            cost: 13919,
            farm_speed_hour: 135.7992,
            APR: 736.69,
        },
        45: {
            cost: 15310,
            farm_speed_hour: 148.8686,
            APR: 736.75,
        },
        46: {
            cost: 16842,
            farm_speed_hour: 162.8631,
            APR: 736.80,
        },
        47: {
            cost: 17950,
            farm_speed_hour: 177.9726,
            APR: 736.85,
        },
        48: {
            cost: 20104,
            farm_speed_hour: 194.8951,
            APR: 736.90,
        },
        49: {
            cost: 22718,
            farm_speed_hour: 214.0176,
            APR: 736.94,
        },
        50: {
            cost: 25898,
            farm_speed_hour: 235.8173,
            APR: 736.98,
        },
    },
};