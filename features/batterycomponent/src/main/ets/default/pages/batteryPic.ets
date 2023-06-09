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

import Constants from '../common/constants'
import Log from '../../../../../../../common/src/main/ets/default/Log'
import StyleConfiguration from '../common/StyleConfiguration'

const TAG = 'BatteryComponent-batteryPic'

@Component
export default
struct BatteryPic {
  @StorageLink('batterySoc') batterySoc: number = 100
  @StorageLink('batteryCharging') batteryCharging : boolean = false
  @Prop mContentColor: string
  @State style: any = StyleConfiguration.getBatteryPicStyle()

  aboutToAppear(){
    Log.showInfo(TAG,'aboutToAppear Start');
  }

  aboutToDisappear(){
    Log.showInfo(TAG,'aboutToDisappear');
  }

  build() {

    Row() {
      Row() {
        Row() {

        }
        .height('100%')
        .width((this.batterySoc < 100 ? this.batterySoc: 100) + '%')
        .backgroundColor(this.getBatteryColor(this.batterySoc, this.batteryCharging))
      }
      .width(this.style.picBodyWidth)
      .height(this.style.picBodyHeight)
      .backgroundColor($r('app.color.battery_background'))
      .border({ width: this.style.picBodyBorderWidth,
        color: this.mContentColor,
        radius: this.style.picBorderRadius,
        style: BorderStyle.Solid })
      .padding(this.style.picBodyPadding)

      Row() {

      }
      .width(this.style.picGap)
      .height(1)

      Row() {

      }
      .width(this.style.picHeadWidth)
      .height(this.style.picHeadHeight)
      .backgroundColor(this.mContentColor)
      .borderRadius(this.style.picHeadBorderRadius)
    }
  }

  private getBatteryColor(val, charging) {
    Log.showInfo(TAG, `getBatteryColor, val: ${ val }  charging: ${ charging } `);
    if (charging) {
      return this.style.picChargingColor;
    } else if (val <= Constants.BATTERY_LEVEL_LOW) {
      return this.style.picLevelLowColor;
    } else {
      return this.mContentColor;
    }
  }
}
