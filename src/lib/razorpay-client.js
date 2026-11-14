let loading;
export function loadRazorpay(){
  if(window.Razorpay)return Promise.resolve();
  if(!loading)loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.id='razorpay-script';script.src='https://checkout.razorpay.com/v1/checkout.js';
    const timer=setTimeout(failed,15000);
    function failed(){clearTimeout(timer);script.remove();loading=null;reject(new Error('Secure payment could not load. Check your connection and retry.'));}
    script.onload=()=>{clearTimeout(timer);if(window.Razorpay)resolve();else failed();};script.onerror=failed;document.head.append(script);
  });
  return loading;
}
