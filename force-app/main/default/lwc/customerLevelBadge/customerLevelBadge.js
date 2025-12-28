import { LightningElement, api, wire } from "lwc";
import { getRecord } from "lightning/uiRecordApi";

const FIELDS = ["Account.CustomerLevel__c"];

/**
 * ⚠️ 아이콘은 "존재 확실한" utility 아이콘만 사용 (404/에러 방지)
 * VIP: favorite / Gold: diamond / Silver: like / Bronze: ribbon
 */
const MAP = {
  "VIP Prestige": {
    icon: "utility:favorite",
    mini: "VIP",
    cls: "title vip",
    dot: "dot vipDot",
    sub: "전담 케어 · 우선 예약 · 우선 배정",
    spark: true
  },
  Gold: {
    icon: "utility:diamond",
    mini: "GOLD",
    cls: "title gold",
    dot: "dot goldDot",
    sub: "우선 배정",
    spark: false
  },
  Silver: {
    icon: "utility:like",
    mini: "SILVER",
    cls: "title silver",
    dot: "dot silverDot",
    sub: "표준 지원",
    spark: false
  },
  Bronze: {
    icon: "utility:ribbon",
    mini: "BRONZE",
    cls: "title bronze",
    dot: "dot bronzeDot",
    sub: "기본 지원",
    spark: false
  }
};

export default class CustomerLevelBadge extends LightningElement {
  @api recordId;

  // ✅ 기본값을 무조건 세팅 (undefined 방지)
  tierLabel = "—";
  iconName = "utility:user";
  titleClass = "title";
  dotClass = "dot";
  subtext = "";
  miniLabel = "LEVEL";
  showSpark = false;

  // ✅ lightning-icon 내부 split() 에러 방지용: 항상 문자열 반환
  get safeIconName() {
    return this.iconName || "utility:user";
  }

  @wire(getRecord, { recordId: "$recordId", fields: FIELDS })
  wiredRecord({ data, error }) {
    if (data) {
      const raw = data.fields?.CustomerLevel__c?.value;

      const cfg =
        (raw && MAP[raw]) || {
          icon: "utility:user",
          mini: "LEVEL",
          cls: "title",
          dot: "dot",
          sub: "",
          spark: false
        };

      this.tierLabel = raw || "—";
      this.iconName = cfg.icon || "utility:user";
      this.miniLabel = cfg.mini || "LEVEL";
      this.titleClass = cfg.cls || "title";
      this.dotClass = cfg.dot || "dot";
      this.subtext = cfg.sub || "";
      this.showSpark = !!cfg.spark;
    } else if (error) {
      // 에러 나도 UI가 깨지지 않게 기본값 유지
      // console.error("customerLevelBadge error:", JSON.stringify(error));
      this.tierLabel = "—";
      this.iconName = "utility:user";
      this.miniLabel = "LEVEL";
      this.titleClass = "title";
      this.dotClass = "dot";
      this.subtext = "";
      this.showSpark = false;
    }
  }
}