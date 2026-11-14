import Checkout from '../../components/Checkout';
import {publicCatalog} from '../../lib/server/catalog';
import './checkout.css';
export const metadata={title:'Guest checkout · Grain Labs'};
export const dynamic='force-dynamic';
export const runtime='nodejs';
export default async function CheckoutPage({searchParams}){
  const params=await searchParams,requested=Number(params.quantity);
  return <Checkout catalog={publicCatalog()} initialQuantity={Number.isInteger(requested)&&requested>=1&&requested<=20?requested:1} />;
}
