import { SiderMenuProps } from '@/components/SiderMenu';
import React, { Component } from 'react';
import Link from 'umi/link';
import RightContent, { GlobalHeaderRightProps } from '../GlobalHeader/RightContent';
import BaseMenu from '../SiderMenu/BaseMenu';
import { getFlatMenuKeys } from '../SiderMenu/SiderMenuUtils';
import styles from './index.less';
import defaultSettings from '../../defaultSettings';
import { ContentWidth } from '@/AppSettings';

export interface TopNavHeaderProps extends SiderMenuProps, GlobalHeaderRightProps {
  contentWidth?: ContentWidth;
  logo?: string;
}

interface TopNavHeaderState {
  maxWidth?: number;
}

export default class TopNavHeader extends Component<TopNavHeaderProps, TopNavHeaderState> {
  static getDerivedStateFromProps(props: TopNavHeaderProps): object {
    return {
      maxWidth: (props.contentWidth === 'Fixed' ? 1200 : window.innerWidth) - 280 - 165 - 40,
    };
  }

  state: TopNavHeaderState = {};

  maim: HTMLDivElement | null = null;

  render() {
    const { theme, contentWidth, menuData, logo } = this.props;
    const { maxWidth } = this.state;
    const flatMenuKeys = getFlatMenuKeys(menuData);
    return (
      <div className={`${styles.head} ${theme === 'light' ? styles.light : ''}`}>
        <div
          ref={ref => (this.maim = ref)} // eslint-disable-line
          className={`${styles.main} ${contentWidth === 'Fixed' ? styles.wide : ''}`}
        >
          <div className={styles.left}>
            <div className={styles.logo} key="logo" id="logo">
              <Link to="/">
                <img src={logo} alt="logo" />
                <h1>{defaultSettings.title}</h1>
              </Link>
            </div>
            <div style={{ maxWidth }}>
              <BaseMenu {...this.props} flatMenuKeys={flatMenuKeys} className={styles.menu} />
            </div>
          </div>
          <RightContent {...this.props} />
        </div>
      </div>
    );
  }
}
