// Renderer for the constrained, trusted editorial Markdown used in this release.
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function inline(s){return esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>');}
export function markdown(s){
 let lines=s.trim().split('\n'),o='',i=0;
 while(i<lines.length){let l=lines[i];if(!l.trim()){i++;continue;}
 if(/^#{1,6} /.test(l)){let n=l.match(/^#+/)[0].length;o+=`<h${n}>${inline(l.slice(n+1))}</h${n}>`;i++;continue;}
 if(/^>/.test(l)){let q=[];while(i<lines.length&&/^>/.test(lines[i]))q.push(lines[i++].replace(/^> ?/,''));o+='<blockquote>'+markdown(q.join('\n'))+'</blockquote>';continue;}
 if(l.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3}/.test(lines[i+1])){let cells=x=>x.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());let head=cells(l);i+=2;let rows=[];while(i<lines.length&&lines[i].includes('|'))rows.push(cells(lines[i++]));o+='<div class="reading-table"><table><thead><tr>'+head.map(x=>'<th scope="col">'+inline(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+inline(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue;}
 if(/^\s*([-*]|\d+\.) /.test(l)){const ordered=/^\s*\d+\./.test(l),tag=ordered?'ol':'ul';o+='<'+tag+'>';while(i<lines.length&&/^\s*([-*]|\d+\.) /.test(lines[i]))o+='<li>'+inline(lines[i++].replace(/^\s*([-*]|\d+\.) /,''))+'</li>';o+='</'+tag+'>';continue;}
 let para=[];while(i<lines.length&&lines[i].trim()&&!/^#{1,6} |^>/.test(lines[i])){para.push(lines[i++]);if(i<lines.length&&/^\s*([-*]|\d+\.) /.test(lines[i]))break;}
 o+='<p>'+para.map(inline).join('\n').replace(/  \n/g,'<br>')+'</p>';
 }return o;
}
