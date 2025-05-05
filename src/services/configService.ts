import { CONFIG } from "../config/config";

export const configService = {
  // 获取配置项
  getConfig(key: keyof typeof CONFIG): string {
    return CONFIG[key];
  },

  // 修改配置项
  setConfig(key: keyof typeof CONFIG, value: string): void {
    if (key in CONFIG) {
      (CONFIG as Partial<typeof CONFIG>)[key] = value; // 使用类型断言修改只读属性
      console.log(`配置项 ${key} 已更新为: ${value}`);
    } else {
      throw new Error(`配置项 ${key} 不存在`);
    }
  },
};

export default configService;
