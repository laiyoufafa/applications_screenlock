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

import Log from '../../../../../../../../../common/src/main/ets/default/Log'
import Constants from '../../common/constants'
import NumkeyBoard from './numkeyBoard'
import ViewModel from '../../vm/customPSDViewModel'

const TAG = 'ScreenLock-CustomPSD'

@Component
export default struct CustomPSD {
  @State mViewModel: ViewModel = new ViewModel()
  @StorageLink('passwordArr') passwordArr: any[]  = this.mViewModel.passwordArr

  aboutToAppear() {
    Log.showInfo(TAG, `aboutToAppear`)
    this.mViewModel.checkFreezingTime(() => {
      Log.showInfo(TAG, `onClick callback is called`)
    });
  }

  aboutToDisappear() {
    Log.showInfo(TAG, `aboutToDisappear`)
    this.mViewModel.clearPassword()
  }

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center, justifyContent: FlexAlign.End }) {
      Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center, justifyContent: FlexAlign.End }) {
        Text(this.mViewModel.prompt)
          .fontSize($r('app.float.custompsd_prompt_fontsize'))
          .fontWeight(FontWeight.Bold)
          .fontColor(Color.White)
          .margin({ bottom: $r('app.float.custompsd_prompt_margin_bottom') })
          .textAlign(TextAlign.Center)
          .textOverflow({ overflow: TextOverflow.None })
          .width($r('app.float.custompsd_prompt_width'))
          .height($r('app.float.custompsd_prompt_height'))

        Stack({ alignContent: Alignment.Center }) {
          Text()
            .width(Constants.FULL_CONTAINER_WIDTH)
            .height(Constants.FULL_CONTAINER_HEIGHT)
            .backgroundColor(Color.Gray)
            .borderRadius($r('app.float.custompsd_input_radius'))

          List({ space: Constants.DIGITALPSD_IC_DIAMETER }) {
            ForEach(this.passwordArr, (item) => {
              ListItem() {
                Image($r("app.media.ic_solid_dot"))
                  .width(Constants.DIGITALPSD_IC_DIAMETER)
                  .height(Constants.DIGITALPSD_IC_DIAMETER)
              }
            })
          }
          .listDirection(Axis.Horizontal)
          .height(Constants.DIGITALPSD_IC_DIAMETER)
        }
        .width($r('app.float.custompsd_input_width'))
        .height($r('app.float.custompsd_input_height'))

        Button($r('app.string.done'), { type: ButtonType.Capsule, stateEffect: true })
          .width($r('app.float.custompsd_input_width'))
          .height($r('app.float.custompsd_input_height'))
          .enabled(this.passwordArr.length > 1)
          .onClick(() => {
            Log.showInfo(TAG, `onClick`)
            this.mViewModel.onAuthPassword(() => {
              Log.showInfo(TAG, `onClick callback promptText:${JSON.stringify(this.mViewModel.prompt)}`)
            });
          })
          .margin({ top: $r('sys.float.ohos_id_elements_margin_vertical_l') })
      }
      .width(Constants.FULL_CONTAINER_WIDTH)
      .height($r('app.float.custompsd_input_area_height'))
      .margin({ bottom: $r('app.float.custompsd_passwdmask_margin_bottom') })

      Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center, justifyContent: FlexAlign.End }) {
        NumkeyBoard({
          viewModel: this.mViewModel,
          onKeypress: (index, callback) => this.mViewModel.onKeyPress(index, callback)
        })
      }
      .width(Constants.FULL_CONTAINER_WIDTH)
      .height($r('app.float.custompsd_key_area_height'))
      .margin({ bottom: $r('app.float.custompsd_key_area_margin_bottom') })
    }
    .width(Constants.FULL_CONTAINER_WIDTH)
  }
}