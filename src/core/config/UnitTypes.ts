/**
 * 单位类型配置文件
 * 根据 src/assets/creature/ 目录下的实际资产维护
 * 添加新单位时，请确保在 creature 目录下有对应的资产文件夹
 */

export const UNIT_TYPES = [
    'skeleton',
    'wolf',
    'manFighter',
    'skeletonArcher',
    'oldCleric',
    'dragonCleric',
    'bigSkeleton',
    'bard',
    "bard's_woman",
    'city_1_guard',
    'city_1_woman',
    'drawf_rider_house_car_1',
    'gunner',
    'lord-meibiwusi',
    'tavern_boss',
    'orc_robber',
] as const;

export type UnitTypeName = string;

/**
 * 大型单位类型列表（占用 2x2 格子）
 * 其他单位默认为中型单位（占用 1x1 格子）
 */
export const BIG_UNIT_TYPES: UnitTypeName[] = [
    'bigSkeleton',
    // 如有其他大型单位，请在此添加
] as const;

/**
 * 检查是否为大型单位
 */
export function isBigUnit(unitTypeName: UnitTypeName): boolean {
    return BIG_UNIT_TYPES.includes(unitTypeName);
}
