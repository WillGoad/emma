import {
  cn,
  copyToClipboard,
  deleteAllCookies,
  formatDate,
  formatSeconds,
  getInitialsFromName,
  setUserCookies,
} from "./utils";
import { setCookie, deleteCookie } from "cookies-next";
import { USER_TOKEN } from "./constants";

describe("formatSeconds", () => {
  it("formats seconds into days when applicable", () => {
    expect(formatSeconds(86400)).toBe("1 day");
    expect(formatSeconds(172800)).toBe("2 days");
    expect(formatSeconds(90000)).toBe("1 day");
  });

  it("formats seconds into hours when less than a day", () => {
    expect(formatSeconds(3600)).toBe("1 hour");
    expect(formatSeconds(7200)).toBe("2 hours");
    expect(formatSeconds(5400)).toBe("1 hours");
    expect(formatSeconds(1800)).toBe("0 hours");
  });

  it("handles edge cases", () => {
    expect(formatSeconds(0)).toBe("0 hours");
  });
});

describe("copyToClipboard", () => {
  const mockWriteText = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
    mockWriteText.mockClear();
    mockToast.mockClear();
  });

  it("copies text to clipboard and shows toast", () => {
    copyToClipboard("test copy", mockToast);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test copy");
    expect(mockToast).toHaveBeenCalledWith({
      title: "Copied! 📋",
      description: "Copied to your clipboard.",
    });
  });
});

describe("formatDate", () => {
  beforeAll(() => {
    jest
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("10/1/2023, 12:34:56 PM");
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("formats a date string correctly", () => {
    const dateStr = "2023-10-01T12:34:56Z";
    expect(formatDate(dateStr)).toBe("10/1/2023, 12:34:56 PM");
  });
});

describe("deleteAllCookies", () => {
  it("deletes the user token cookie", () => {
    deleteAllCookies();
    expect(deleteCookie).toHaveBeenCalledWith(USER_TOKEN);
  });
});

jest.mock("cookies-next", () => ({
  deleteCookie: jest.fn(),
  setCookie: jest.fn(),
}));

describe("setUserCookies", () => {
  it("sets the user token cookie with correct options", () => {
    const accessToken = "test-token";
    setUserCookies(accessToken);

    expect(setCookie).toHaveBeenCalledWith(USER_TOKEN, accessToken, {
      maxAge: 2592000, // 30 days in seconds
      sameSite: "strict",
    });
  });
});

describe("getInitialsFromName", () => {
  it("returns the first two initials for multi-word names", () => {
    expect(getInitialsFromName("John Doe")).toBe("JD");
    expect(getInitialsFromName("Mary Jane Smith")).toBe("MJ");
  });

  it("returns a single initial for single-word names", () => {
    expect(getInitialsFromName("Alice")).toBe("A");
  });

  it("handles empty string", () => {
    expect(getInitialsFromName("")).toBe("");
  });
});

describe("cn", () => {
  it("merges Tailwind classes correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("hover:bg-red-500 bg-red-400")).toBe(
      "hover:bg-red-500 bg-red-400"
    );
  });

  it("handles conditional classes", () => {
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
    expect(cn({ "bg-red-500": true }, "text-white")).toBe(
      "bg-red-500 text-white"
    );
  });
});
