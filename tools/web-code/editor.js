let editor;


let rootHandle;


let currentHandle;


let selectedHandle;


let selectedParent;


let tabs={};


let activeTab=null;


let timer;



// Monaco

require.config({

paths:{
vs:
"https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"
}

});



require(
["vs/editor/editor.main"],

()=>{


editor =
monaco.editor.create(
document.getElementById("editor"),
{

value:"",

language:"javascript",

theme:"vs-dark",

automaticLayout:true,

minimap:{
enabled:true
}

});


checkRecovery();



editor.onDidChangeModelContent(
()=>{


if(!activeTab)
return;


tabs[activeTab].content =
editor.getValue();


tabs[activeTab].changed=true;


backup();


clearTimeout(timer);


timer =
setTimeout(
()=>autoSave(activeTab),
1000
);



});


});





// フォルダ

async function openFolder(){


rootHandle =
await window.showDirectoryPicker();


refreshExplorer();

}





async function refreshExplorer(){


files.innerHTML="";


await createTree(
rootHandle,
files
);

}




async function createTree(
handle,
box
){


for await(
let [name,child]
of handle.entries()
){


let div =
document.createElement("div");



if(child.kind==="directory"){


div.className="folder";

div.textContent=
"📁 "+name;



let inner =
document.createElement("div");


inner.style.marginLeft="15px";

inner.style.display="none";



div.onclick=()=>{

inner.style.display =
inner.style.display==="none"
?
"block"
:
"none";


selectItem(
child,
handle
);

};



box.append(div,inner);



await createTree(
child,
inner
);



}

else{


div.className="file";

div.textContent=
"📄 "+name;



div.onclick=()=>{

selectItem(
child,
handle
);

openFile(child);

};



box.appendChild(div);

}


}


}






function selectItem(
h,p
){

selectedHandle=h;

selectedParent=p;

}







// ファイル

async function openFile(handle){


let file =
await handle.getFile();



let text =
await file.text();



if(!tabs[handle.name]){


tabs[handle.name]={

handle,

content:text,

lastModified:file.lastModified

};


createTab(
handle.name
);

}



activeTab=handle.name;


editor.setValue(
tabs[activeTab].content
);


startWatcher();


}




function createTab(name){


let div =
document.createElement("div");


div.className="tab";


div.id="tab-"+name;


div.innerHTML=
name+" <span class='close'>×</span>";



div.onclick=e=>{


if(e.target.className==="close"){

closeTab(name);

}
else{

switchTab(name);

}


};



tabsEl.appendChild(div);

}





function switchTab(name){


activeTab=name;


editor.setValue(
tabs[name].content
);

}





function closeTab(name){


delete tabs[name];


document
.getElementById(
"tab-"+name
)
.remove();


}





// 保存

async function saveFile(){


let item =
tabs[activeTab];


let w =
await item.handle.createWritable();


await w.write(
item.content
);


await w.close();


}




async function autoSave(id){


await saveFile();


showStatus(
"自動保存"
);


}





function showStatus(t){


saveStatus.textContent=t;


setTimeout(
()=>saveStatus.textContent="",
1500
);


}







// 新規

async function newFile(){


let name =
prompt("名前");


let h =
await rootHandle.getFileHandle(
name,
{
create:true
}
);


refreshExplorer();


openFile(h);


}




async function newFolder(){


let name =
prompt("フォルダ名");


await rootHandle.getDirectoryHandle(
name,
{
create:true
}
);


refreshExplorer();

}




// 名前変更

async function renameItem(){


let name =
prompt(
"新しい名前",
selectedHandle.name
);


let file =
await selectedHandle.getFile();



let n =
await selectedParent.getFileHandle(
name,
{
create:true
}
);



let w =
await n.createWritable();


await w.write(
await file.arrayBuffer()
);


await w.close();


await selectedParent.removeEntry(
selectedHandle.name
);


refreshExplorer();


}





// 削除

async function deleteItem(){


if(confirm("削除しますか")){


await selectedParent.removeEntry(
selectedHandle.name,
{
recursive:true
}
);


refreshExplorer();

}


}





// バックアップ

function backup(){


localStorage.setItem(
"backup",
editor.getValue()
);


}



function checkRecovery(){


let b =
localStorage.getItem(
"backup"
);


if(b &&
confirm("復元しますか？")
){

editor.setValue(b);

}


}






// 監視

function startWatcher(){


setInterval(
async()=>{


let item =
tabs[activeTab];


let f =
await item.handle.getFile();



if(
item.lastModified &&
item.lastModified!==f.lastModified
){


if(confirm(
"外部変更を反映しますか？"
)){


editor.setValue(
await f.text()
);


}


}


item.lastModified =
f.lastModified;



},
2000
);


}





document.addEventListener(
"keydown",
e=>{


if(
e.ctrlKey &&
e.key==="s"
){

e.preventDefault();

saveFile();

}


});
