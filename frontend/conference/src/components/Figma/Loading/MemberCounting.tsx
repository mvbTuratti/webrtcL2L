
interface Props {
    number: number;
}

const MemberCounting = ({ number }: Props) => {
    return ( 
        <>
        <div className="inline-flex h-[42px] items-center justify-center p-2 relative bg-[#191b23] rounded-[40px] border border-solid border-[#1d1f27]">
          <div className="inline-flex items-start gap-2 px-2 py-0 relative flex-[0_0_auto]">
            <p className="relative w-fit mt-[-1.00px] font-desktop-body-2-semibold-14px font-[number:var(--desktop-body-2-semibold-14px-font-weight)] text-[#eff0fa] text-[length:var(--desktop-body-2-semibold-14px-font-size)] text-center tracking-[var(--desktop-body-2-semibold-14px-letter-spacing)] leading-[var(--desktop-body-2-semibold-14px-line-height)] whitespace-nowrap [font-style:var(--desktop-body-2-semibold-14px-font-style)]">
              {number > 0 ? (
                number === 1 ? (<>{number} pessoa na sala</>) : (<>{number} pessoas na sala</>)
              ) : (
                <>A sala está vazia</>
              )}
            </p>
          </div>
        </div>
        </>
     );
}
 
export default MemberCounting;