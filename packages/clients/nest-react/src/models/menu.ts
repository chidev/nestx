import { MenuDataItem } from '@/components/SiderMenu';
import Authorized from '@/utils/Authorized';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';
import { formatMessage } from 'umi-plugin-locale';
import { IRoute } from 'umi-types';
import defaultSettings from '../defaultSettings';
import { ModelType } from './connect';

// Conversion router to menu.
function formatter(
  data: MenuDataItem[],
  parentAuthority?: string[] | string,
  parentName?: string,
): MenuDataItem[] {
  return data
    .filter(item => item.name && item.path)
    .map(item => {
      const locale = `${parentName || 'menu'}.${item.name!}`;
      // if enableMenuLocale use item.name,
      // close menu international
      const name = defaultSettings.menu.disableLocal
        ? item.name!
        : formatMessage({ id: locale, defaultMessage: item.name! });
      const result: MenuDataItem = {
        ...item,
        name,
        locale,
        authority: item.authority || parentAuthority,
      };
      if (item.routes) {
        const children = formatter(item.routes!, item.authority, locale);
        // Reduce memory usage
        result.children = children;
      }
      delete result.routes;
      return result;
    });
}

const memoizeOneFormatter = memoizeOne(formatter, isEqual);

/**
 * filter menuData
 */
const filterMenuData = (menuData: MenuDataItem[] = []): MenuDataItem[] => {
  return menuData
    .filter(item => item.name && !item.hideInMenu)
    .map(item => Authorized.check<any, any>(item.authority!, getSubMenu(item), null)) // eslint-disable-line
    .filter(item => item);
};

/**
 * get SubMenu or Item
 */
const getSubMenu: (item: MenuDataItem) => MenuDataItem = item => {
  if (
    Array.isArray(item.children) &&
    !item.hideChildrenInMenu &&
    item.children.some(child => !!child.name)
  ) {
    const children = filterMenuData(item.children);
    if (children.length) return { ...item, children };
  }
  return { ...item, children: void 0 };
};

/**
 * 获取面包屑映射
 * @param MenuDataItem[] menuData 菜单配置
 */
const getBreadcrumbNameMap = (menuData: MenuDataItem[]) => {
  const routerMap: { [key: string]: MenuDataItem } = {};
  const flattenMenuData: (data: MenuDataItem[]) => void = data => {
    data.forEach(menuItem => {
      if (menuItem.children) {
        flattenMenuData(menuItem.children);
      }
      routerMap[menuItem.path] = menuItem;
    });
  };
  flattenMenuData(menuData);
  return routerMap;
};

const memoizeOneGetBreadcrumbNameMap = memoizeOne(getBreadcrumbNameMap, isEqual);

export interface MenuModelState {
  menuData: MenuDataItem[];
  routerData: IRoute[];
  breadcrumbNameMap: object;
}

const MenuModel: ModelType<MenuModelState> = {
  namespace: 'menu',
  state: {
    menuData: [],
    routerData: [],
    breadcrumbNameMap: {},
  },
  effects: {
    *getMenuData({ payload }, { put }) {
      const { routes, authority } = payload;
      const originalMenuData = memoizeOneFormatter(routes, authority);
      const menuData = filterMenuData(originalMenuData);
      const breadcrumbNameMap = memoizeOneGetBreadcrumbNameMap(originalMenuData);
      yield put({
        type: 'save',
        payload: { menuData, breadcrumbNameMap, routerData: routes },
      });
    },
  },
  reducers: {
    save(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
};

export default MenuModel;
