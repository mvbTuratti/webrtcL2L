import image from "./progress.svg";

export const ProgressIndicators = (): JSX.Element => {
  return (
    <div className="relative bg-[100%_100%] w-14 h-14">
      {/* <img className="absolute top-[1006px] left-[1723px] w-14 h-14" alt="Surface" src={image} /> */}
      <img className="animate-spin w-14 h-14" alt="Surface" src={image} />
    </div>
  );
};