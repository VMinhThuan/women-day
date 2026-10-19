const toast=document.querySelector('#toast');let timer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),4200)}
document.querySelectorAll('.wish-card').forEach(card=>card.addEventListener('click',()=>showToast(card.dataset.message)));
document.querySelector('#celebrate-btn').addEventListener('click',()=>{showToast('Chúc chị Nhi luôn xinh tươi và rực rỡ trong những chiếc đầm chị yêu thích! ♡');for(let i=0;i<34;i++){const flower=document.createElement('span');flower.className='flower-pop';flower.textContent=i%2?'✿':'♥';flower.style.left=`${Math.random()*100}vw`;flower.style.top=`${-20-Math.random()*60}px`;flower.style.setProperty('--x',`${(Math.random()-.5)*220}px`);flower.style.animationDelay=`${Math.random()*.45}s`;document.body.append(flower);setTimeout(()=>flower.remove(),3300)}});

const nameReveal=document.querySelector('.name-reveal');
const revealObserver=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){nameReveal.classList.add('revealed');revealObserver.unobserve(nameReveal)}},{threshold:.48});
revealObserver.observe(nameReveal);

const mosaicReveal=document.querySelector('.mosaic-reveal');
const mosaicObserver=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){mosaicReveal.classList.add('revealed');mosaicObserver.unobserve(mosaicReveal)}},{threshold:.35});
mosaicObserver.observe(mosaicReveal);
