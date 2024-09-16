import OutlinePeople  from "./OutlinePeople";

interface Props {
  initials: string;
  size: "large" | "small";
  nameFilled: boolean;
}

const Avatar = ({ initials = "KA", size, nameFilled }: Props): JSX.Element => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-[80px] justify-center bg-[#7d47ea] relative ${
        size === "small" ? "w-14" : "w-[88px]"
      } ${size === "small" ? "h-14" : "h-[88px]"}`}
    >
      {nameFilled && (
        <div
          className={`w-fit text-white text-center whitespace-nowrap relative ${
            size === "small" ? "font-desktop-heading-5-semibold-24px" : "font-desktop-heading-4-semibold-34px"
          } ${
            size === "small"
              ? "tracking-[var(--desktop-heading-5-semibold-24px-letter-spacing)]"
              : "tracking-[var(--desktop-heading-4-semibold-34px-letter-spacing)]"
          } ${
            size === "small"
              ? "[font-style:var(--desktop-heading-5-semibold-24px-font-style)]"
              : "[font-style:var(--desktop-heading-4-semibold-34px-font-style)]"
          } ${
            size === "small"
              ? "text-[length:var(--desktop-heading-5-semibold-24px-font-size)]"
              : "text-[length:var(--desktop-heading-4-semibold-34px-font-size)]"
          } ${size === "small" ? "mt-[-1.00px]" : ""} ${size === "small" ? "mr-[-1.00px]" : ""} ${
            size === "small" ? "ml-[-1.00px]" : ""
          } ${
            size === "small"
              ? "font-[number:var(--desktop-heading-5-semibold-24px-font-weight)]"
              : "font-[number:var(--desktop-heading-4-semibold-34px-font-weight)]"
          } ${
            size === "small"
              ? "leading-[var(--desktop-heading-5-semibold-24px-line-height)]"
              : "leading-[var(--desktop-heading-4-semibold-34px-line-height)]"
          }`}
        >
          {initials}
        </div>
      )}

      {!nameFilled && (
        <OutlinePeople
          className={
            size === "small" ? "!h-10 !mr-[-4.00px] !mt-[-4.00px] !ml-[-4.00px] !mb-[-4.00px] !w-10" : "!h-10 !w-10"
          }
        //   vector={size === "small" ? "vector-2.svg" : "image.svg"}
          vectorClassName="!h-[27px] !left-2 !w-6 !top-[7px]"
        />
      )}
    </div>
  );
};

export default Avatar;