// Renderer for the constrained, trusted editorial Markdown used in this release.
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function inline(s){return esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>');}
export function markdown(s,images={}){
 let lines=s.trim().split('\n'),o='',i=0;
 while(i<lines.length){let l=lines[i];if(!l.trim()){i++;continue;}
 const imageMatch=l.match(/^!\[([^\]]+)\]\(([^)]+)\)$/);
 if(imageMatch){
  const image=images[imageMatch[2]];
  if(!image || !/^\/assets\/editorial\/[a-z0-9/-]+\.(?:jpg|png|webp)$/.test(image.src) || image.src.includes('..'))throw Error('Unapproved editorial image '+imageMatch[2]);
  if(!Number.isSafeInteger(image.width) || image.width<1 || !Number.isSafeInteger(image.height) || image.height<1)throw Error('Invalid editorial image dimensions');
  const source=new URL(image.sourceUrl);
  if(source.protocol!=='https:' || source.username || source.password)throw Error('Invalid editorial image source');
  i++;
  while(i<lines.length && !lines[i].trim())i++;
  const caption=lines[i];
  if(!caption || /^#|^!\[|^>/.test(caption))throw Error('Editorial image needs a caption');
  i++;
  const captionHtml=inline(caption).replace(/<a href=/g,'<a target="_blank" rel="noopener noreferrer" href=');
  const attribution=caption.includes(']('+image.sourceUrl+')') ? '' : ' <a href="'+esc(source.href)+'" target="_blank" rel="noopener noreferrer">Источник ↗</a>';
  o+='<figure class="editorial-figure"><a href="'+esc(image.src)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc('Открыть изображение: '+imageMatch[1])+'"><img src="'+esc(image.src)+'" alt="'+esc(imageMatch[1])+'" width="'+image.width+'" height="'+image.height+'" loading="lazy" decoding="async"></a><figcaption>'+captionHtml+attribution+'</figcaption></figure>';
  continue;
 }
 const sourceMatch=l.match(/^\*\*\[([^\]]+)\]\((https:\/\/[^)]+)\)\*\*$/);
 if(sourceMatch){
  const source=new URL(sourceMatch[2]);
  if(source.username || source.password)throw Error('Invalid editorial source link');
  o+='<p class="editorial-source"><a href="'+esc(source.href)+'" target="_blank" rel="noopener noreferrer">'+esc(sourceMatch[1])+'</a></p>';
  i++;
  continue;
 }
 if(/^#{1,6} /.test(l)){let n=l.match(/^#+/)[0].length;o+=`<h${n}>${inline(l.slice(n+1))}</h${n}>`;i++;continue;}
 if(/^>/.test(l)){let q=[];while(i<lines.length&&/^>/.test(lines[i]))q.push(lines[i++].replace(/^> ?/,''));o+='<blockquote>'+markdown(q.join('\n'),images)+'</blockquote>';continue;}
 if(l.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3}/.test(lines[i+1])){let cells=x=>x.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());let head=cells(l);i+=2;let rows=[];while(i<lines.length&&lines[i].includes('|'))rows.push(cells(lines[i++]));o+='<div class="reading-table"><table><thead><tr>'+head.map(x=>'<th scope="col">'+inline(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+inline(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue;}
 if(/^\s*([-*]|\d+\.) /.test(l)){const ordered=/^\s*\d+\./.test(l),tag=ordered?'ol':'ul';o+='<'+tag+'>';while(i<lines.length&&/^\s*([-*]|\d+\.) /.test(lines[i]))o+='<li>'+inline(lines[i++].replace(/^\s*([-*]|\d+\.) /,''))+'</li>';o+='</'+tag+'>';continue;}
 let para=[];while(i<lines.length&&lines[i].trim()&&!/^#{1,6} |^>/.test(lines[i])){para.push(lines[i++]);if(i<lines.length&&/^\s*([-*]|\d+\.) /.test(lines[i]))break;}
 o+='<p>'+para.map(inline).join('\n').replace(/  \n/g,'<br>')+'</p>';
 }return o;
}
