// Réconciliation des fondations avec les tokens CSS. Responsable : Jonathan Kakesa.
const page = await figma.getNodeByIdAsync('0:1');
await figma.setCurrentPageAsync(page);
for (const style of ['Regular','Medium','SemiBold']) await figma.loadFontAsync({family:'Poppins',style});
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const primitives = collections.find(c=>c.id==='VariableCollectionId:2:2');
const light = collections.find(c=>c.id==='VariableCollectionId:2:19');
const dimensions = collections.find(c=>c.id==='VariableCollectionId:2:31');
const dark = collections.find(c=>c.name==='Fluentia · Couleurs sombres') || figma.variables.createVariableCollection('Fluentia · Couleurs sombres');
const color = hex => ({r:parseInt(hex.slice(0,2),16)/255,g:parseInt(hex.slice(2,4),16)/255,b:parseInt(hex.slice(4,6),16)/255});
const changed=[];
function token(name,collection,type){let v=vars.find(v=>v.name===name&&v.variableCollectionId===collection.id);if(!v){v=figma.variables.createVariable(name,collection,type);vars.push(v);}changed.push(v.id);return v;}
const palettes={light:{bg:'f7faff',surface:'ffffff',text:'081b35',muted:'52647a',border:'c9d4e3','control-border':'71829a',action:'1769e0','on-action':'ffffff',accent:'086b82',focus:'1769e0',danger:'a12535',tint:'eaf1fc'},dark:{bg:'081b35',surface:'102944',text:'f7faff',muted:'b7c9df',border:'526982','control-border':'7e94ae',action:'21d4f4','on-action':'081b35',accent:'21d4f4',focus:'21d4f4',danger:'ffb1b9',tint:'163658'}};
for(const [theme,palette] of Object.entries(palettes))for(const [name,hex]of Object.entries(palette)){
 let p=vars.find(v=>v.variableCollectionId===primitives.id&&Object.values(v.valuesByMode).some(v=>v.r!==undefined&&Math.abs(v.r-color(hex).r)<.001&&Math.abs(v.g-color(hex).g)<.001&&Math.abs(v.b-color(hex).b)<.001));
 if(!p){p=token('hex/'+hex,primitives,'COLOR');p.setValueForMode(primitives.defaultModeId,color(hex));}
 p.scopes=[];p.setVariableCodeSyntax('WEB',`var(--primitive-${hex})`);changed.push(p.id);
 const c=theme==='light'?light:dark;const v=token(name,c,'COLOR');v.scopes=['border','control-border','focus'].includes(name)?['STROKE_COLOR']:['text','muted','on-action','danger'].includes(name)?['TEXT_FILL']:['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(c.defaultModeId,{type:'VARIABLE_ALIAS',id:p.id});v.setVariableCodeSyntax('WEB',`var(--${name})`);
}
for(const [name,value,css]of [['spacing/4',4,'space-1'],['spacing/8',8,'space-2'],['spacing/12',12,'button-gap'],['spacing/16',16,'space-3'],['spacing/24',24,'space-4'],['spacing/32',32,'space-5'],['spacing/48',48,'space-6'],['padding/button-y',12.8,'button-py'],['padding/button-x',20,'button-px'],['padding/card',25.6,'card-padding'],['padding/input',11.2,'input-padding'],['radius/button',9.6,'button-radius'],['radius/input',8,'input-radius'],['radius/card',14.4,'radius']]){const v=token(name,dimensions,'FLOAT');v.scopes=[name.startsWith('radius')?'CORNER_RADIUS':'GAP'];v.setValueForMode(dimensions.defaultModeId,value);v.setVariableCodeSyntax('WEB',`var(--${css})`);}
const styles=await figma.getLocalTextStylesAsync();const styleIds={};
for(const [name,size,weight,line]of [['Body',15,'Regular',170],['Heading',40,'SemiBold',115],['Button',13.12,'SemiBold',150],['Label',12.8,'Medium',170],['Caption',11.2,'Regular',170],['H3',18.4,'SemiBold',115],['Section',28.8,'Medium',115],['Badge',9.6,'Medium',170]]){let s=styles.find(s=>s.name==='Fluentia/'+name)||figma.createTextStyle();s.name='Fluentia/'+name;s.fontName={family:'Poppins',style:weight};s.fontSize=size;s.lineHeight={unit:'PERCENT',value:line};styleIds[name]=s.id;changed.push(s.id);}
return {pageId:page.id,collections:{primitives:primitives.id,light:light.id,dark:dark.id,dimensions:dimensions.id},variables:vars.map(v=>({id:v.id,name:v.name,collection:v.variableCollectionId})),styles:styleIds,mutatedIds:[...new Set(changed)],limitations:['Starter : deux collections sémantiques distinctes, un mode chacune.']};
