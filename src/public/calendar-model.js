window.BBCalendarModel=(()=>{
 const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const add=(value,n)=>{const d=new Date(value+'T12:00:00');d.setDate(d.getDate()+n);return key(d)};
 const monday=value=>{const d=new Date(value+'T12:00:00');return add(value,-((d.getDay()+6)%7))};
 const monthDays=value=>{const first=value.slice(0,7)+'-01',start=monday(first);return Array.from({length:42},(_,i)=>add(start,i))};
 const minutes=value=>{const [h,m]=String(value).slice(0,5).split(':').map(Number);return h*60+m};
 const time=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
 function layout(items){const result=[];let group=[],end=-1;const finish=()=>{const lanes=[];for(const item of group){let lane=lanes.findIndex(stop=>stop<=item.start);if(lane<0)lane=lanes.length;lanes[lane]=item.end;item.lane=lane}for(const item of group)result.push({...item,lanes:lanes.length});group=[]};for(const item of items.map(a=>({...a,start:minutes(a.time),end:minutes(a.time)+30})).sort((a,b)=>a.start-b.start)){if(item.start>=end&&group.length)finish();group.push(item);end=Math.max(group.length===1?item.end:end,item.end)}if(group.length)finish();return result}
 return{key,add,monday,monthDays,minutes,time,layout};
})();
