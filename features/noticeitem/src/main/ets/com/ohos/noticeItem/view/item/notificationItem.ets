/*
 * Copyright (c) 2021-2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Constants, {NotificationLayout as Layout} from '../../common/constants';
import GeneralItem from './generalItem';
import CustomItem from './customItem';
import Log from '../../../../../../../../../../common/src/main/ets/default/Log';
import ViewModel from '../../viewmodel/ViewModel';
import DevicesDialog from './devicesDialog';
import WantAgent from '@ohos.wantAgent';
import IconListComponent, {getIconListSize} from './iconListComponent';
import ScrollbarManager from '../../common/ScrollbarManager';

const TAG = 'NoticeItem-NotificationItem';

@Component
export default struct NotificationItem {
  @State mIconAlpha: number = 0;
  @State @Watch('scrollEdge') mEdgeEnd: boolean = false;
  @State itemWidth: string = '100%'
  private itemData: any = {}
  private isSubItem: boolean= false;
  private mScroller: Scroller = new Scroller();

  build() {
    Stack() {
      IconListComponent({ iconAlpha: this.mIconAlpha, itemData: this.itemData })

      Scroll(this.mScroller) {
        Row() {
          FrontItem({ itemData: this.itemData, isSubItem: this.isSubItem })
          IconListComponent({ iconAlpha: 0, itemData: this.itemData })
        }
      }
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.On)
      .onScroll(() => {
        this.mIconAlpha += 0.1;
        this.mIconAlpha = this.mScroller.currentOffset().xOffset * 1.0 / getIconListSize();
      })
      .onScrollEnd(() => {
        this.mEdgeEnd = (this.mEdgeEnd &&
        this.mScroller.currentOffset().xOffset > (getIconListSize() - Layout.SCROLL_THRESHOLD))
        || (!this.mEdgeEnd && this.mScroller.currentOffset().xOffset > Layout.SCROLL_THRESHOLD)
        ScrollbarManager.restoreOtherScroll(this.mScroller);
      })
    }.width(this.itemWidth)
    .borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0)
    .clip(!this.isSubItem)
  }

  scrollEdge() {
    this.mScroller.scrollEdge(this.mEdgeEnd ? Edge.End : Edge.Start)
  }
}

@Component
struct FrontItem {
  private itemData: any = {}
  private nowWant: any;
  private isSubItem: boolean= false;
  private devicesDialogController: CustomDialogController = new CustomDialogController({
    builder: DevicesDialog({
      action: (deviceID) => this.selectedDevice(deviceID)
    }),
    autoCancel: false,
    offset: { dx: 0, dy: 200 }
  });

  build() {
    Column() {
      if (this.itemData.template) {
        CustomItem({ customItemData: this.itemData, isSubItem: this.isSubItem })
      } else {
        GeneralItem({ itemData: this.itemData, clickAction: () => this.showDevicesDialog(), isSubItem: this.isSubItem })
      }
    }
    .width('100%')
    .borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0)
    .backgroundColor($r('app.color.notificationitem_background'))
  }

  showDevicesDialog() {
    Log.showInfo(TAG, `showDevicesDialog isDistributed: ${this.itemData?.distributedOption?.isDistributed}`)
    if (!this.itemData?.distributedOption?.isDistributed) {
      ViewModel.clickItem(this.itemData);
      return;
    }
    let wantAgent = this.itemData?.want;
    if (!!wantAgent) {
      WantAgent.getWant(wantAgent).then((want) => {
        this.nowWant = want
        Log.showInfo(TAG, `showDevicesDialog want: ${JSON.stringify(this.nowWant)}`)
        if (!want?.deviceId) {
          this.devicesDialogController.open()
        } else {
          ViewModel.clickItem(this.itemData);
        }
      })
    } else {
      ViewModel.clickItem(this.itemData);
    }
  }

  selectedDevice(deviceID) {
    Log.showInfo(TAG, `selectedDevice deviceID:${deviceID}`)
    this.nowWant.deviceId = deviceID;
    let triggerInfo = {
      code: 0,
      want: this.nowWant,
      permission: '',
      extraInfo: {}
    };
    ViewModel.clickDistributionItem(this.itemData, triggerInfo)
  }
}

