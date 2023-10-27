import { useMount } from "ahooks";
import { Layout, Spin } from "antd";
import { t } from "i18next";
import { Outlet, useMatches, useNavigate } from "react-router-dom";

import LeftNavBar from "./LeftNavBar";
import TopSearchBar from "./TopSearchBar";
import { useGlobalEvent } from "./useGlobalEvents";

export const MainContentLayout = () => {
  const matches = useMatches();
  const navigate = useNavigate();
  const [connectState] = useGlobalEvent();

  useMount(() => {
    const isRoot = !matches.find((item) => item.pathname !== "/");
    const inConversation = matches.some((item) => item.params.conversationID);
    if (isRoot || inConversation) {
      navigate("chat", {
        replace: true,
      });
    }
  });

  const loadingTip = connectState.isLogining ? t("toast.loading") : t("toast.syncing");

  return (
    <Spin
      className="!max-h-none"
      spinning={connectState.isLogining || connectState.isSyncing}
      tip={loadingTip}
    >
      <Layout className="h-full">
        <TopSearchBar />
        <Layout>
          <LeftNavBar />
          <Outlet />
        </Layout>
      </Layout>
    </Spin>
  );
};
