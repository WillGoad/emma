"use client";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { deleteAllCookies } from "./utils";

type HotkeysProps = {
  toggleSearchDialog: () => void;
};

export default function Hotkeys({ toggleSearchDialog }: HotkeysProps) {
  const router = useRouter();

  useHotkeys("ctrl+shift+e", () => router.push("/"), {
    enableOnFormTags: true,
    preventDefault: true,
  });
  useHotkeys("ctrl+shift+z", () => router.push("/dashboard"), {
    enableOnFormTags: true,
    enabled: false,
  });
  useHotkeys("ctrl+shift+u", () => router.push("/docs"), {
    enableOnFormTags: true,
    enabled: false,
  });
  useHotkeys("ctrl+shift+r", () => router.push("/support"), {
    enableOnFormTags: true,
    enabled: false,
  });
  useHotkeys("ctrl+shift+y", () => router.push("/settings"), {
    enableOnFormTags: true,
  });
  useHotkeys("ctrl+shift+f", () => router.push("/settings?tab=account"), {
    enableOnFormTags: true,
    enabled: false,
  });
  useHotkeys("ctrl+shift+l", () => router.push("/settings?tab=billing"), {
    enableOnFormTags: true,
    enabled: false,
  });
  useHotkeys("ctrl+shift+n", () => deleteAllCookies(), {
    enableOnFormTags: true,
  });
  useHotkeys("ctrl+k", toggleSearchDialog, {
    enableOnFormTags: true,
    preventDefault: true,
  });

  return null;
}
