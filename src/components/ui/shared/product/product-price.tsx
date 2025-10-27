import { cn } from "@/lib/utils"; /* utilita speciale funzione usata per le classi dinamiche   */

const ProductPrice = ({value, className}: {value: number; className?: string; }) => {

    /* vogliamo garantire due cifre decimali */
    const stringValue = value.toFixed(2);
    // Otteniamo l intero e il decimale int/float
    const [intValue, floatValue] = stringValue.split('.') /* Dividiamo l intero dal decimale */
    
    return ( <p className={cn("text-2xl", className)}>
        <span className="text-xs align-super">€</span>
        {intValue}
        <span className="text-xs align-super">.{floatValue}</span>

    </p> );
}
 
export default ProductPrice;