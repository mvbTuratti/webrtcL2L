interface Props {
  aspectRatio:
| "two-hundred-and-nineteen"
| "golden-ratio-1-618-1"
| "one-thousand-six-hundred-and-ten"
| "a4"
| "twenty-one"
| "fifty-four"
| "letter"
| "thirty-two"
| "eleven"
| "one-hundred-and-sixty-nine"
| "forty-three";
  portrait: boolean;
  fiftyHeight: boolean;
  className: any;
}

const FixedAspectRatio = ({ aspectRatio, portrait, fiftyHeight, className }: Props): JSX.Element => {
  return (
    <div
      className={`w-60 flex flex-col items-start bg-cover bg-[50%_50%] relative ${
      !fiftyHeight && aspectRatio === "letter" && portrait
      ? "bg-[url(/aspect-ratio-letter-portrait-yes-50-height-no.png)]"
      : aspectRatio === "letter" && fiftyHeight && !portrait
      ? "bg-[url(/aspect-ratio-letter-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "letter" && !portrait
      ? "bg-[url(/aspect-ratio-letter-portrait-no-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "a4" && portrait
      ? "bg-[url(/aspect-ratio-a4-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "a4" && portrait
      ? "bg-[url(/aspect-ratio-a4-portrait-yes-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "a4" && !portrait
      ? "bg-[url(/aspect-ratio-a4-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "a4" && !portrait
      ? "bg-[url(/aspect-ratio-a4-portrait-no-50-height-no.png)]"
      : fiftyHeight && portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "bg-[url(/aspect-ratio-21-9-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "bg-[url(/aspect-ratio-21-9-portrait-yes-50-height-no.png)]"
      : fiftyHeight && !portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "bg-[url(/aspect-ratio-21-9-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && !portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "bg-[url(/aspect-ratio-21-9-portrait-no-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "twenty-one" && portrait
      ? "bg-[url(/aspect-ratio-2-1-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "twenty-one" && portrait
      ? "bg-[url(/aspect-ratio-2-1-portrait-yes-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "twenty-one" && !portrait
      ? "bg-[url(/aspect-ratio-2-1-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "twenty-one" && !portrait
      ? "bg-[url(/aspect-ratio-2-1-portrait-no-50-height-no.png)]"
      : fiftyHeight && portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "bg-[url(/aspect-ratio-16-9-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "bg-[url(/aspect-ratio-16-9-portrait-yes-50-height-no.png)]"
      : fiftyHeight && !portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "bg-[url(/aspect-ratio-16-9-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && !portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "bg-[url(/aspect-ratio-16-9-portrait-no-50-height-no.png)]"
      : fiftyHeight && portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "bg-[url(/aspect-ratio-golden-ratio-1-618-1-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "bg-[url(/aspect-ratio-golden-ratio-1-618-1-portrait-yes-50-height-no.png)]"
      : fiftyHeight && !portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "bg-[url(/aspect-ratio-golden-ratio-1-618-1-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && !portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "bg-[url(/aspect-ratio-golden-ratio-1-618-1-portrait-no-50-height-no.png)]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && fiftyHeight && portrait
      ? "bg-[url(/aspect-ratio-16-10-portrait-yes-50-height-yes.png)]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && !fiftyHeight && portrait
      ? "bg-[url(/aspect-ratio-16-10-portrait-yes-50-height-no.png)]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && fiftyHeight && !portrait
      ? "bg-[url(/aspect-ratio-16-10-portrait-no-50-height-yes.png)]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && !fiftyHeight && !portrait
      ? "bg-[url(/aspect-ratio-16-10-portrait-no-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "thirty-two" && portrait
      ? "bg-[url(/aspect-ratio-3-2-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "thirty-two" && portrait
      ? "bg-[url(/aspect-ratio-3-2-portrait-yes-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "thirty-two" && !portrait
      ? "bg-[url(/aspect-ratio-3-2-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "thirty-two" && !portrait
      ? "bg-[url(/aspect-ratio-3-2-portrait-no-50-height-no.png)]"
      : aspectRatio === "forty-three" && fiftyHeight && portrait
      ? "bg-[url(/aspect-ratio-4-3-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "forty-three" && portrait
      ? "bg-[url(/aspect-ratio-4-3-portrait-yes-50-height-no.png)]"
      : aspectRatio === "forty-three" && !portrait && fiftyHeight
      ? "bg-[url(/aspect-ratio-4-3-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "forty-three" && !portrait
      ? "bg-[url(/aspect-ratio-4-3-portrait-no-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "fifty-four" && portrait
      ? "bg-[url(/aspect-ratio-5-4-portrait-yes-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "fifty-four" && portrait
      ? "bg-[url(/aspect-ratio-5-4-portrait-yes-50-height-no.png)]"
      : fiftyHeight && aspectRatio === "fifty-four" && !portrait
      ? "bg-[url(/aspect-ratio-5-4-portrait-no-50-height-yes.png)]"
      : !fiftyHeight && aspectRatio === "fifty-four" && !portrait
      ? "bg-[url(/aspect-ratio-5-4-portrait-no-50-height-no.png)]"
      : aspectRatio === "eleven" && fiftyHeight && portrait
      ? "bg-[url(/aspect-ratio-1-1-portrait-yes-50-height-yes.png)]"
      : aspectRatio === "eleven" && !fiftyHeight && portrait
      ? "bg-[url(/aspect-ratio-1-1-portrait-yes-50-height-no.png)]"
      : aspectRatio === "eleven" && fiftyHeight && !portrait
      ? "bg-[url(/aspect-ratio-1-1-portrait-no-50-height-yes.png)]"
      : aspectRatio === "eleven" && !fiftyHeight && !portrait
      ? "bg-[url(/aspect-ratio-1-1-portrait-no-50-height-no.png)]"
      : "bg-[url(/aspect-ratio-letter-portrait-yes-50-height-yes.png)]"
            } ${
              (!fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
              (fiftyHeight && aspectRatio === "golden-ratio-1-618-1" && portrait) ||
              (fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
              (fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
              (fiftyHeight && aspectRatio === "twenty-one" && portrait) ||
              (aspectRatio === "a4" && portrait) ||
              (aspectRatio === "eleven" && portrait) ||
              (aspectRatio === "forty-three" && portrait) ||
              (aspectRatio === "letter" && portrait) ||
              (aspectRatio === "thirty-two" && portrait) ||
              (aspectRatio === "two-hundred-and-nineteen" && portrait) ||
      !portrait
      ? "overflow-hidden"
      : ""
            } ${className}`}
          >
            <div
      className={`w-full self-stretch relative ${
                (!fiftyHeight && aspectRatio === "a4") ||
                (!fiftyHeight && aspectRatio === "eleven") ||
                (!fiftyHeight && aspectRatio === "fifty-four") ||
                (!fiftyHeight && aspectRatio === "forty-three") ||
                (!fiftyHeight && aspectRatio === "letter") ||
                (fiftyHeight && aspectRatio === "a4" && portrait) ||
                (fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                (aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
                (aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (aspectRatio === "thirty-two" && portrait) ||
                (aspectRatio === "twenty-one" && portrait) ||
                (aspectRatio === "two-hundred-and-nineteen" && portrait)
      ? "flex"
      : ""
              } ${
      !fiftyHeight && aspectRatio === "letter" && !portrait
      ? "mt-[-27.27px]"
      : fiftyHeight && aspectRatio === "a4" && portrait
      ? "mt-[-35.14px]"
      : fiftyHeight && aspectRatio === "a4" && !portrait
      ? "mt-[-78.58px]"
      : !fiftyHeight && aspectRatio === "a4" && !portrait
      ? "mt-[-35.15px]"
      : fiftyHeight && portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "mt-[-13.33px]"
      : fiftyHeight && portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "mt-[-22.92px]"
      : (fiftyHeight || !portrait) &&
                    (portrait || !fiftyHeight) &&
                    (fiftyHeight || aspectRatio === "fifty-four") &&
                    (!portrait || aspectRatio === "one-thousand-six-hundred-and-ten")
      ? "mt-[-24.00px]"
      : (fiftyHeight || !portrait) &&
                    (portrait || !fiftyHeight) &&
                    (fiftyHeight || aspectRatio === "forty-three") &&
                    (!portrait || aspectRatio === "thirty-two")
      ? "mt-[-30.00px]"
      : aspectRatio === "forty-three" && !portrait && fiftyHeight
      ? "mt-[-76.00px]"
      : ""
              } ${
                (!fiftyHeight && aspectRatio === "a4" && portrait) ||
                (!fiftyHeight && aspectRatio === "forty-three" && portrait) ||
                (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (!fiftyHeight && aspectRatio === "letter" && portrait) ||
                (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
                (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (!fiftyHeight && aspectRatio === "thirty-two" && portrait) ||
                (!fiftyHeight && aspectRatio === "twenty-one" && portrait) ||
                (aspectRatio === "fifty-four" && portrait) ||
                (aspectRatio === "two-hundred-and-nineteen" && portrait)
      ? "flex-col"
      : ""
              } ${!fiftyHeight && aspectRatio === "letter" && portrait ? "opacity-70" : ""} ${
                (!fiftyHeight && aspectRatio === "a4") ||
                (!fiftyHeight && aspectRatio === "eleven") ||
                (!fiftyHeight && aspectRatio === "fifty-four") ||
                (!fiftyHeight && aspectRatio === "forty-three") ||
                (!fiftyHeight && aspectRatio === "letter") ||
                (fiftyHeight && aspectRatio === "a4" && portrait) ||
                (fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                (aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
                (aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (aspectRatio === "thirty-two" && portrait) ||
                (aspectRatio === "twenty-one" && portrait) ||
                (aspectRatio === "two-hundred-and-nineteen" && portrait)
      ? "items-start"
      : ""
              } ${
                (fiftyHeight && aspectRatio === "eleven") ||
                (fiftyHeight && aspectRatio === "fifty-four" && !portrait) ||
                (fiftyHeight && aspectRatio === "forty-three" && portrait) ||
                (fiftyHeight && aspectRatio === "letter") ||
                (aspectRatio === "golden-ratio-1-618-1" && !portrait) ||
                (aspectRatio === "one-hundred-and-sixty-nine" && !portrait) ||
                (aspectRatio === "one-thousand-six-hundred-and-ten" && !portrait) ||
                (aspectRatio === "thirty-two" && !portrait) ||
                (aspectRatio === "twenty-one" && !portrait) ||
                (aspectRatio === "two-hundred-and-nineteen" && !portrait)
      ? "mr-[-1.00px]"
      : ""
              } ${
                (!fiftyHeight && aspectRatio === "a4" && portrait) ||
                (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (!fiftyHeight && aspectRatio === "thirty-two") ||
                (!fiftyHeight && aspectRatio === "twenty-one") ||
                (fiftyHeight && aspectRatio === "eleven") ||
                (fiftyHeight && aspectRatio === "fifty-four" && !portrait) ||
                (fiftyHeight && aspectRatio === "letter" && !portrait) ||
                (fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine" && !portrait) ||
                (fiftyHeight && aspectRatio === "thirty-two" && !portrait) ||
                (fiftyHeight && aspectRatio === "twenty-one" && !portrait) ||
                (aspectRatio === "fifty-four" && portrait) ||
                (aspectRatio === "forty-three" && portrait) ||
                (aspectRatio === "golden-ratio-1-618-1" && !portrait) ||
                (aspectRatio === "letter" && portrait) ||
                (aspectRatio === "one-thousand-six-hundred-and-ten" && !portrait) ||
      aspectRatio === "two-hundred-and-nineteen"
      ? "flex-[0_0_auto]"
      : ""
              } ${
                (fiftyHeight && aspectRatio === "eleven") ||
                (fiftyHeight && aspectRatio === "fifty-four" && !portrait) ||
                (fiftyHeight && aspectRatio === "forty-three" && portrait) ||
                (fiftyHeight && aspectRatio === "letter") ||
                (aspectRatio === "golden-ratio-1-618-1" && !portrait) ||
                (aspectRatio === "one-hundred-and-sixty-nine" && !portrait) ||
                (aspectRatio === "one-thousand-six-hundred-and-ten" && !portrait) ||
                (aspectRatio === "thirty-two" && !portrait) ||
                (aspectRatio === "twenty-one" && !portrait) ||
                (aspectRatio === "two-hundred-and-nineteen" && !portrait)
      ? "ml-[-1.00px]"
      : ""
              } ${
                (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
                (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (!fiftyHeight && aspectRatio === "twenty-one" && portrait) ||
                (!fiftyHeight && aspectRatio === "two-hundred-and-nineteen" && portrait)
      ? "gap-2.5"
      : ""
              } ${
      aspectRatio === "letter" && fiftyHeight && portrait
      ? "rotate-[-40.32deg]"
      : !fiftyHeight && aspectRatio === "letter" && portrait
      ? "rotate-[150.46deg]"
      : aspectRatio === "letter" && fiftyHeight && !portrait
      ? "rotate-[-22.73deg]"
      : !fiftyHeight && aspectRatio === "letter" && !portrait
      ? "rotate-[-46.00deg]"
      : fiftyHeight && aspectRatio === "a4" && portrait
      ? "rotate-[-50.19deg]"
      : !fiftyHeight && aspectRatio === "a4" && portrait
      ? "rotate-[138.00deg]"
      : fiftyHeight && aspectRatio === "a4" && !portrait
      ? "rotate-[-69.30deg]"
      : !fiftyHeight && aspectRatio === "a4" && !portrait
      ? "rotate-[-45.10deg]"
      : fiftyHeight && portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[166.61deg]"
      : !fiftyHeight && portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[-26.45deg]"
      : fiftyHeight && !portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[-12.37deg]"
      : !fiftyHeight && !portrait && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[-25.38deg]"
      : (portrait || !fiftyHeight) &&
                    (fiftyHeight || aspectRatio === "eleven") &&
                    (!fiftyHeight || aspectRatio === "twenty-one")
      ? "rotate-[-45.00deg]"
      : (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                    (!fiftyHeight && aspectRatio === "twenty-one" && portrait)
      ? "rotate-[-44.00deg]"
      : fiftyHeight && aspectRatio === "twenty-one" && !portrait
      ? "rotate-[-14.48deg]"
      : (fiftyHeight || !portrait) &&
                    (fiftyHeight || aspectRatio === "twenty-one") &&
                    (!fiftyHeight || aspectRatio === "eleven")
      ? "rotate-[-30.00deg]"
      : !fiftyHeight && portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[-44.16deg]"
      : fiftyHeight && !portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[-16.33deg]"
      : !fiftyHeight && !portrait && aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[-34.23deg]"
      : fiftyHeight && !portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "rotate-[-18.00deg]"
      : !fiftyHeight && !portrait && aspectRatio === "golden-ratio-1-618-1"
      ? "rotate-[-38.17deg]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && fiftyHeight && !portrait
      ? "rotate-[-18.21deg]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && !fiftyHeight && !portrait
      ? "rotate-[-38.68deg]"
      : !fiftyHeight && aspectRatio === "thirty-two" && portrait
      ? "rotate-[143.62deg]"
      : fiftyHeight && aspectRatio === "thirty-two" && !portrait
      ? "rotate-[-19.47deg]"
      : (fiftyHeight || !portrait) &&
                    (portrait || !fiftyHeight) &&
                    (fiftyHeight || aspectRatio === "thirty-two") &&
                    (!portrait || aspectRatio === "forty-three")
      ? "rotate-[-41.81deg]"
      : !fiftyHeight && aspectRatio === "forty-three" && portrait
      ? "rotate-[143.61deg]"
      : aspectRatio === "forty-three" && !portrait && fiftyHeight
      ? "rotate-[-67.98deg]"
      : fiftyHeight && aspectRatio === "fifty-four" && portrait
      ? "rotate-[178.30deg]"
      : !fiftyHeight && aspectRatio === "fifty-four" && portrait
      ? "rotate-[143.59deg]"
      : fiftyHeight && aspectRatio === "fifty-four" && !portrait
      ? "rotate-[-23.58deg]"
      : !fiftyHeight && aspectRatio === "fifty-four" && !portrait
      ? "rotate-[-45.13deg]"
      : "-rotate-45"
              } ${
                (!fiftyHeight && aspectRatio === "a4" && !portrait) ||
                (!fiftyHeight && aspectRatio === "eleven") ||
                (!fiftyHeight && aspectRatio === "fifty-four" && !portrait) ||
                (!fiftyHeight && aspectRatio === "forty-three" && !portrait) ||
                (!fiftyHeight && aspectRatio === "letter" && !portrait) ||
                (fiftyHeight && aspectRatio === "a4" && portrait) ||
                (fiftyHeight && aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
                (fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (fiftyHeight && aspectRatio === "thirty-two" && portrait) ||
                (fiftyHeight && aspectRatio === "twenty-one" && portrait)
      ? "h-60"
      : fiftyHeight && !portrait && ["a4", "forty-three"].includes(aspectRatio)
      ? "h-[242px]"
      : ""
              }`}
            >
              {((!fiftyHeight && aspectRatio === "a4") ||
                (!fiftyHeight && aspectRatio === "eleven") ||
                (!fiftyHeight && aspectRatio === "fifty-four") ||
                (!fiftyHeight && aspectRatio === "forty-three") ||
                (!fiftyHeight && aspectRatio === "letter") ||
                (fiftyHeight && aspectRatio === "a4" && portrait) ||
                (fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                (aspectRatio === "golden-ratio-1-618-1" && portrait) ||
                (aspectRatio === "one-hundred-and-sixty-nine" && portrait) ||
                (aspectRatio === "one-thousand-six-hundred-and-ten" && portrait) ||
                (aspectRatio === "thirty-two" && portrait) ||
                (aspectRatio === "twenty-one" && portrait) ||
                (aspectRatio === "two-hundred-and-nineteen" && portrait)) && (
                <div
      className={`self-stretch relative ${
                    (!fiftyHeight && aspectRatio === "a4" && portrait) ||
                    (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (!fiftyHeight && aspectRatio === "thirty-two") ||
                    (!fiftyHeight && aspectRatio === "twenty-one") ||
                    (aspectRatio === "fifty-four" && portrait) ||
                    (aspectRatio === "forty-three" && portrait) ||
                    (aspectRatio === "letter" && portrait) ||
      aspectRatio === "two-hundred-and-nineteen"
      ? "w-full"
      : ""
                  } ${
                    (!fiftyHeight && aspectRatio === "a4" && portrait) ||
                    (!fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                    (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (!fiftyHeight && aspectRatio === "thirty-two") ||
                    (!fiftyHeight && aspectRatio === "twenty-one") ||
                    (aspectRatio === "forty-three" && portrait) ||
                    (aspectRatio === "letter" && portrait) ||
      aspectRatio === "two-hundred-and-nineteen"
      ? "flex"
      : ""
                  } ${
                    (fiftyHeight && aspectRatio === "a4") ||
                    (fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (fiftyHeight && aspectRatio === "thirty-two") ||
                    (fiftyHeight && aspectRatio === "twenty-one") ||
      aspectRatio === "eleven" ||
                    (aspectRatio === "fifty-four" && !portrait) ||
                    (aspectRatio === "forty-three" && !portrait)
      ? "mt-[-1.00px]"
      : fiftyHeight && aspectRatio === "fifty-four"
      ? "mt-[-49.52px]"
      : ""
                  } ${
                    (!fiftyHeight && aspectRatio === "a4" && portrait) ||
                    (!fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                    (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (!fiftyHeight && aspectRatio === "thirty-two") ||
                    (!fiftyHeight && aspectRatio === "twenty-one") ||
                    (aspectRatio === "forty-three" && portrait) ||
                    (aspectRatio === "letter" && portrait) ||
      aspectRatio === "two-hundred-and-nineteen"
      ? "flex-col"
      : ""
                  } ${
                    (!fiftyHeight && aspectRatio === "a4" && portrait) ||
                    (!fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                    (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (!fiftyHeight && aspectRatio === "thirty-two") ||
                    (!fiftyHeight && aspectRatio === "twenty-one") ||
                    (aspectRatio === "forty-three" && portrait) ||
                    (aspectRatio === "letter" && portrait) ||
      aspectRatio === "two-hundred-and-nineteen"
      ? "items-start"
      : ""
                  } ${aspectRatio === "a4" && !portrait ? "mr-[-0.20px]" : ""} ${
                    (!fiftyHeight && aspectRatio === "fifty-four") ||
      aspectRatio === "a4" ||
      aspectRatio === "eleven" ||
      aspectRatio === "forty-three" ||
      aspectRatio === "golden-ratio-1-618-1" ||
      aspectRatio === "letter" ||
      aspectRatio === "one-hundred-and-sixty-nine" ||
      aspectRatio === "one-thousand-six-hundred-and-ten" ||
      aspectRatio === "thirty-two" ||
      aspectRatio === "twenty-one" ||
      aspectRatio === "two-hundred-and-nineteen"
      ? "flex-[0_0_auto]"
      : ""
                  } ${!fiftyHeight && ["twenty-one", "two-hundred-and-nineteen"].includes(aspectRatio) ? "gap-2.5" : ""} ${
      aspectRatio === "letter" && portrait
      ? "rotate-[21.50deg]"
      : aspectRatio === "letter" && !portrait
      ? "rotate-[6.23deg]"
      : fiftyHeight && aspectRatio === "a4"
      ? "rotate-[5.00deg]"
      : !fiftyHeight && aspectRatio === "a4" && portrait
      ? "rotate-[28.70deg]"
      : aspectRatio === "a4" && !portrait
      ? "rotate-[-0.10deg]"
      : fiftyHeight && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[24.76deg]"
      : !fiftyHeight && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[-28.50deg]"
      : aspectRatio === "eleven" || (fiftyHeight && aspectRatio === "twenty-one")
      ? "rotate-[24.47deg]"
      : !fiftyHeight && aspectRatio === "twenty-one"
      ? "rotate-[-27.05deg]"
      : fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[14.90deg]"
      : !fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[31.06deg]"
      : fiftyHeight && aspectRatio === "golden-ratio-1-618-1"
      ? "rotate-[8.29deg]"
      : !fiftyHeight && aspectRatio === "golden-ratio-1-618-1"
      ? "rotate-[151.01deg]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && fiftyHeight
      ? "rotate-[7.55deg]"
      : aspectRatio === "one-thousand-six-hundred-and-ten" && !fiftyHeight
      ? "rotate-[154.08deg]"
      : !fiftyHeight && aspectRatio === "thirty-two"
      ? "rotate-[44.39deg]"
      : aspectRatio === "forty-three" && portrait
      ? "rotate-[21.39deg]"
      : fiftyHeight && aspectRatio === "fifty-four"
      ? "rotate-[53.44deg]"
      : !fiftyHeight && aspectRatio === "fifty-four" && portrait
      ? "rotate-[13.71deg]"
      : aspectRatio === "fifty-four" && !portrait
      ? "rotate-[7.66deg]"
      : "rotate-[3.48deg]"
                  } ${fiftyHeight && aspectRatio === "fifty-four" ? "h-[242px]" : ""} ${
                    (fiftyHeight && aspectRatio === "two-hundred-and-nineteen") ||
                    (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten")
      ? "overflow-hidden"
      : ""
                  } ${
                    (fiftyHeight && aspectRatio === "a4") ||
                    (fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (fiftyHeight && aspectRatio === "thirty-two") ||
                    (fiftyHeight && aspectRatio === "twenty-one") ||
      aspectRatio === "eleven" ||
                    (aspectRatio === "fifty-four" && !portrait) ||
                    (aspectRatio === "forty-three" && !portrait)
      ? "mb-[-1.00px]"
      : fiftyHeight && aspectRatio === "fifty-four"
      ? "mb-[-49.52px]"
      : ""
                  }`}
                >
                  {((!fiftyHeight && aspectRatio === "a4" && portrait) ||
                    (!fiftyHeight && aspectRatio === "fifty-four" && portrait) ||
                    (!fiftyHeight && aspectRatio === "golden-ratio-1-618-1") ||
                    (!fiftyHeight && aspectRatio === "one-hundred-and-sixty-nine") ||
                    (!fiftyHeight && aspectRatio === "one-thousand-six-hundred-and-ten") ||
                    (!fiftyHeight && aspectRatio === "thirty-two") ||
                    (!fiftyHeight && aspectRatio === "twenty-one") ||
                    (aspectRatio === "forty-three" && portrait) ||
                    (aspectRatio === "letter" && portrait) ||
      aspectRatio === "two-hundred-and-nineteen") && (
                    <div
      className={`w-full self-stretch relative ${
      aspectRatio === "golden-ratio-1-618-1" ||
      aspectRatio === "one-hundred-and-sixty-nine" ||
      aspectRatio === "one-thousand-six-hundred-and-ten" ||
      aspectRatio === "twenty-one" ||
                        (!fiftyHeight && aspectRatio === "two-hundred-and-nineteen")
      ? "flex"
      : ""
                      } ${
                        ["a4", "fifty-four", "forty-three", "letter"].includes(aspectRatio)
      ? "mt-[-49.52px]"
      : fiftyHeight || aspectRatio === "thirty-two"
      ? "mt-[-49.32px]"
      : ["golden-ratio-1-618-1", "one-thousand-six-hundred-and-ten"].includes(aspectRatio)
      ? "mt-[-10.40px]"
      : ""
                      } ${
      aspectRatio === "one-hundred-and-sixty-nine" ||
      aspectRatio === "twenty-one" ||
                        (!fiftyHeight && aspectRatio === "two-hundred-and-nineteen")
      ? "flex-col"
      : ""
                      } ${
      aspectRatio === "golden-ratio-1-618-1" ||
      aspectRatio === "one-hundred-and-sixty-nine" ||
      aspectRatio === "one-thousand-six-hundred-and-ten" ||
      aspectRatio === "twenty-one" ||
                        (!fiftyHeight && aspectRatio === "two-hundred-and-nineteen")
      ? "items-start"
      : ""
                      } ${!fiftyHeight && aspectRatio === "two-hundred-and-nineteen" ? "gap-2.5" : ""} ${
      aspectRatio === "one-hundred-and-sixty-nine" ||
      aspectRatio === "twenty-one" ||
                        (!fiftyHeight && aspectRatio === "two-hundred-and-nineteen")
      ? "flex-[0_0_auto]"
      : ""
                      } ${
      fiftyHeight || aspectRatio === "thirty-two"
      ? "rotate-[53.32deg]"
      : !fiftyHeight && aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[-32.16deg]"
      : aspectRatio === "twenty-one"
      ? "rotate-[44.00deg]"
      : aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[44.66deg]"
      : ["golden-ratio-1-618-1", "one-thousand-six-hundred-and-ten"].includes(aspectRatio)
      ? "rotate-[-127.00deg]"
      : "rotate-[53.44deg]"
                      } ${
      fiftyHeight ||
      aspectRatio === "a4" ||
      aspectRatio === "fifty-four" ||
      aspectRatio === "forty-three" ||
      aspectRatio === "letter" ||
      aspectRatio === "thirty-two"
      ? "h-[242px]"
      : ["golden-ratio-1-618-1", "one-thousand-six-hundred-and-ten"].includes(aspectRatio)
      ? "h-60"
      : ""
                      } ${
                        ["a4", "fifty-four", "forty-three", "letter"].includes(aspectRatio)
      ? "mb-[-49.52px]"
      : aspectRatio === "thirty-two"
      ? "mb-[-49.32px]"
      : ""
                      }`}
                    >
                      {(aspectRatio === "golden-ratio-1-618-1" ||
      aspectRatio === "one-hundred-and-sixty-nine" ||
      aspectRatio === "one-thousand-six-hundred-and-ten" ||
      aspectRatio === "twenty-one" ||
                        (!fiftyHeight && aspectRatio === "two-hundred-and-nineteen")) && (
                        <div
      className={`self-stretch flex-[0_0_auto] relative ${
                            ["one-hundred-and-sixty-nine", "twenty-one", "two-hundred-and-nineteen"].includes(aspectRatio)
      ? "w-full"
      : ""
                          } ${["twenty-one", "two-hundred-and-nineteen"].includes(aspectRatio) ? "flex" : ""} ${
                            ["golden-ratio-1-618-1", "one-thousand-six-hundred-and-ten"].includes(aspectRatio)
      ? "mt-[-1.00px]"
      : ""
                          } ${["twenty-one", "two-hundred-and-nineteen"].includes(aspectRatio) ? "flex-col" : ""} ${
                            ["twenty-one", "two-hundred-and-nineteen"].includes(aspectRatio) ? "items-start" : ""
                          } ${aspectRatio === "one-hundred-and-sixty-nine" ? "mr-[-1.00px]" : ""} ${
      aspectRatio === "one-hundred-and-sixty-nine" ? "ml-[-1.00px]" : ""
                          } ${
      aspectRatio === "two-hundred-and-nineteen"
      ? "rotate-[39.00deg]"
      : aspectRatio === "twenty-one"
      ? "rotate-[44.66deg]"
      : aspectRatio === "one-hundred-and-sixty-nine"
      ? "rotate-[-140.34deg]"
      : "rotate-[-22.96deg]"
                          } ${
                            ["golden-ratio-1-618-1", "one-thousand-six-hundred-and-ten"].includes(aspectRatio)
      ? "mb-[-1.00px]"
      : ""
                          }`}
                        >
                    {["twenty-one", "two-hundred-and-nineteen"].includes(aspectRatio) && (
                      <div
className={`w-full self-stretch flex-[0_0_auto] relative ${
 aspectRatio === "two-hundred-and-nineteen" ? "flex" : ""
                        } ${aspectRatio === "two-hundred-and-nineteen" ? "flex-col" : ""} ${
 aspectRatio === "two-hundred-and-nineteen" ? "items-start" : ""
                        } ${aspectRatio === "twenty-one" ? "mr-[-1.00px]" : ""} ${
 aspectRatio === "twenty-one" ? "ml-[-1.00px]" : ""
                        } ${aspectRatio === "twenty-one" ? "rotate-[-140.34deg]" : "rotate-[44.66deg]"}`}
                      >
                        {aspectRatio === "two-hundred-and-nineteen" && (
                          <div className="relative self-stretch w-full flex-[0_0_auto] ml-[-1.00px] mr-[-1.00px] rotate-[-135.34deg]" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default FixedAspectRatio;