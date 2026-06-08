import React, { forwardRef } from "react";
import type { ScrollViewProps } from "react-native";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";
import type { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Ref = React.ElementRef<typeof KeyboardChatScrollView>;

type ChatScrollViewProps = ScrollViewProps & {
  inverted?: boolean;
  extraContentPadding?: SharedValue<number>;
  keyboardLiftBehavior?: "always" | "whenAtEnd" | "persistent" | "never";
};

const FOOTER_GAP = 8;

export const ChatScrollView = forwardRef<Ref, ChatScrollViewProps>(
  ({ inverted, extraContentPadding, keyboardLiftBehavior = "always", ...props }, ref) => {
    const { bottom } = useSafeAreaInsets();

    return (
      <KeyboardChatScrollView
        ref={ref}
        inverted={inverted}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardLiftBehavior={keyboardLiftBehavior}
        offset={Math.max(bottom - FOOTER_GAP, 0)}
        extraContentPadding={extraContentPadding}
        {...props}
      />
    );
  },
);

ChatScrollView.displayName = "ChatScrollView";
