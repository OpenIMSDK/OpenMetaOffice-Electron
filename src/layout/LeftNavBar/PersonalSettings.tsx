import { CloseOutlined, RightOutlined } from "@ant-design/icons";
import { Checkbox, Divider, Modal, Spin } from "antd";
import { t } from "i18next";
import { forwardRef, ForwardRefRenderFunction, memo, useRef } from "react";
import { useMutation } from "react-query";

import { modal } from "@/AntdGlobalComp";
import { errorHandle } from "@/api/errorHandle";
import {
  BusinessAllowType,
  BusinessUserInfo,
  updateBusinessUserInfo,
} from "@/api/login";
import i18n from "@/i18n";
import { useMessageStore, useUserStore } from "@/store";
import { LocaleString } from "@/store/type";
import { feedbackToast } from "@/utils/common";
import { MessageReceiveOptType } from "@/utils/open-im-sdk-wasm/types/enum";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";
import { IMSDK } from "../MainContentWrap";
import BlackList from "./BlackList";
import ChangePassword from "./ChangePassword";

const PersonalSettings: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const backListRef = useRef<OverlayVisibleHandle>(null);
  const changePasswordRef = useRef<OverlayVisibleHandle>(null);

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      centered
      destroyOnClose
      maskStyle={{
        opacity: 0,
        transition: "none",
      }}
      width={600}
      className="no-padding-modal max-w-[70vw]"
      maskTransitionName=""
    >
      <PersonalSettingsContent
        closeOverlay={closeOverlay}
        openBackListOverlay={() => backListRef.current?.openOverlay()}
        openChangePasswordOverlay={() => changePasswordRef.current?.openOverlay()}
      />
      <BlackList ref={backListRef} />
      <ChangePassword ref={changePasswordRef} />
    </Modal>
  );
};

export default memo(forwardRef(PersonalSettings));

export const PersonalSettingsContent = ({
  closeOverlay,
  openBackListOverlay,
  openChangePasswordOverlay,
}: {
  closeOverlay?: () => void;
  openBackListOverlay?: () => void;
  openChangePasswordOverlay?: () => void;
}) => {
  const selfInfo = useUserStore((state) => state.selfInfo);
  const localeStr = useUserStore((state) => state.appSettings.locale);
  const closeAction = useUserStore((state) => state.appSettings.closeAction);
  const updateAppSettings = useUserStore((state) => state.updateAppSettings);
  const updateSelfInfo = useUserStore((state) => state.updateSelfInfo);
  const clearHistoryMessage = useMessageStore((state) => state.clearHistoryMessage);

  const { isLoading: businessSettingUpdating, mutate: updateBusinessSetting } =
    useMutation(updateBusinessUserInfo, {
      onError: errorHandle,
    });
  const { isLoading: recvMessageOptUpdating, mutate: updateRecvMessageOpt } =
    useMutation((opt: MessageReceiveOptType) => IMSDK.setGlobalRecvMessageOpt(opt), {
      onError: errorHandle,
    });

  const localeChange = (checked: boolean, locale: LocaleString) => {
    if (!checked) return;
    window.electronAPI?.ipcInvoke("changeLanguage", locale);
    i18n.changeLanguage(locale);
    updateAppSettings({
      locale,
    });
  };

  const closeActionChange = (checked: boolean, action: "miniSize" | "quit") => {
    if (checked) {
      window.electronAPI?.ipcInvoke("setKeyStore", {
        key: "closeAction",
        data: action,
      });
      updateAppSettings({
        closeAction: action,
      });
    }
  };

  const tryClearChatLogs = () => {
    modal.confirm({
      title: t("toast.clearChatHistory"),
      content: t("toast.confirmClearChatHistory"),
      onOk: async () => {
        try {
          await IMSDK.deleteAllMsgFromLocalAndSvr();
          clearHistoryMessage();
        } catch (error) {
          feedbackToast({ error });
        }
      },
    });
  };

  const toBlackList = () => {
    openBackListOverlay?.();
  };

  const toChangePassword = () => {
    openChangePasswordOverlay?.();
  };

  const businessSettingsUpdate = (vaule: boolean, key: keyof BusinessUserInfo) => {
    const updateInfo: Partial<BusinessUserInfo> = {};
    if (key === "globalRecvMsgOpt") {
      updateInfo[key] = vaule
        ? MessageReceiveOptType.NotNotify
        : MessageReceiveOptType.Nomal;
      updateRecvMessageOpt(updateInfo[key]!, {
        onSuccess: () => {
          updateSelfInfo(updateInfo);
        },
      });
      return;
    }
    if (key === "allowAddFriend") {
      updateInfo[key] = !vaule ? BusinessAllowType.Allow : BusinessAllowType.NotAllow;
    }

    updateBusinessSetting(updateInfo, {
      onSuccess: () => {
        updateSelfInfo(updateInfo);
      },
    });
  };

  return (
    <div className="flex max-h-[80vh] flex-col bg-[var(--chat-bubble)]">
      <div className="app-drag flex items-center justify-between bg-[var(--gap-text)] p-5">
        <span className="text-base font-medium">{t("placeholder.accountSetting")}</span>
        <CloseOutlined
          className="app-no-drag cursor-pointer text-[#8e9aaf]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6">
          <div>
            <div className="pb-5 pt-4 text-base font-medium">
              {t("placeholder.personalSetting")}
            </div>
            <div className="pb-8 pl-1">
              <div className="pb-3 font-medium">{t("placeholder.chooseLanguage")}</div>
              <div>
                <Checkbox
                  checked={localeStr === "zh-CN"}
                  className="w-36"
                  onChange={(e) => localeChange(e.target.checked, "zh-CN")}
                >
                  简体中文
                </Checkbox>
                <Checkbox
                  checked={localeStr === "en-US"}
                  onChange={(e) => localeChange(e.target.checked, "en-US")}
                >
                  English
                </Checkbox>
              </div>
            </div>
            {Boolean(window.electronAPI) && (
              <div className="pb-8 pl-1">
                <div className="pb-3 font-medium">
                  {t("placeholder.closeButtonEvent")}
                </div>
                <div>
                  <Checkbox
                    checked={closeAction === "quit"}
                    className="w-36"
                    onChange={(e) => closeActionChange(e.target.checked, "quit")}
                  >
                    {t("placeholder.exitApplication")}
                  </Checkbox>
                  <Checkbox
                    checked={closeAction === "miniSize"}
                    onChange={(e) => closeActionChange(e.target.checked, "miniSize")}
                  >
                    {t("placeholder.minimize")}
                  </Checkbox>
                </div>
              </div>
            )}
            <div className="pb-8 pl-1">
              <div className="pb-3 font-medium">{t("placeholder.messageToast")}</div>
              <Spin spinning={businessSettingUpdating || recvMessageOptUpdating}>
                <div>
                  <Checkbox
                    checked={
                      selfInfo.globalRecvMsgOpt === MessageReceiveOptType.NotNotify
                    }
                    onChange={(e) =>
                      businessSettingsUpdate(e.target.checked, "globalRecvMsgOpt")
                    }
                  >
                    {t("placeholder.messageNotNotify")}
                  </Checkbox>
                </div>
              </Spin>
            </div>
            <div className="pb-8 pl-1">
              <div className="pb-3 font-medium">
                {t("placeholder.addFriendsSetting")}
              </div>
              <div>
                <Spin spinning={businessSettingUpdating}>
                  <Checkbox
                    checked={selfInfo.allowAddFriend === BusinessAllowType.NotAllow}
                    onChange={(e) =>
                      businessSettingsUpdate(e.target.checked, "allowAddFriend")
                    }
                  >
                    {t("placeholder.refuseAddFriend")}
                  </Checkbox>
                </Spin>
              </div>
            </div>
          </div>
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex cursor-pointer items-center justify-between px-6 py-4"
          onClick={toBlackList}
        >
          <div className="text-base font-medium">{t("placeholder.blackList")}</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div
          className="flex cursor-pointer items-center justify-between px-6 py-4"
          onClick={toChangePassword}
        >
          <div className="text-base font-medium">{t("placeholder.changePassword")}</div>
          <RightOutlined rev={undefined} />
        </div>
        <Divider className="m-0 border-4 border-[var(--gap-text)]" />
        <div className="cursor-pointer px-6 py-4">
          <div
            className="text-base font-medium text-[var(--warn-text)]"
            onClick={tryClearChatLogs}
          >
            {t("toast.clearChatHistory")}
          </div>
        </div>
      </div>
    </div>
  );
};
