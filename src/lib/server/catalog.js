import 'server-only';
import {configuration} from './commerce.mjs';
export function publicCatalog(){
  const c=configuration();
  return {name:'Women’s Oats',size:'70 g',price:c.price,currency:'INR',shipping:c.shippingPaise,paymentReady:c.ready,test:c.test,notificationReady:[c.smtpHost,c.smtpUser,c.smtpPassword,c.emailFrom,c.founderEmail].every(Boolean)};
}
