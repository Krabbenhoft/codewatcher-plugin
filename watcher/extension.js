const vscode = require('vscode');
const axios = require('axios');
/**
 * @param {vscode.ExtensionContext} context
 */

const configForm = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
const configJson = { headers: { 'Content-Type': 'application/json' } }

//document specific variables
let docAbsoluteFilePath
let docRelativeFilePath
let docLangId
let activeLine
let docText=""
let idleTime=0 // saves time since last change occured
let changes=[];
let docActive=""
let isTimerRunning=false
let unsavedLogs=false
let currentSelection=""

function activate(context) {
	console.log('Congratulations, your extension "watcher" is now active!');

	const login = vscode.commands.registerCommand('watcher.login', async () => { await onLogin() })

    onCheckServerConnection();
	if(vscode.window.activeTextEditor){ handleNewActiveEditor(vscode.window.activeTextEditor) }

	context.subscriptions.push(
		login,
		vscode.window.onDidChangeActiveTextEditor(handleNewActiveEditor),
		vscode.workspace.onDidChangeTextDocument(handleDocumentChange),
		vscode.window.onDidChangeTextEditorSelection(handleSelectionChange),
		vscode.window.onDidChangeWindowState(handleFocusChange),
		vscode.commands.registerCommand('watcher.myPasteCommand',handlePasteAction),
		vscode.commands.registerCommand('watcher.myCopyCommand',handleCopyAction)
	)
}

//------------------ROUTES-------------------//
// async function onCheckServerConnection(){
//     await axios.post('http://0.0.0.0:8083/ping')
// 	.then(response => {
// 		axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
//         vscode.window.showInformationMessage(response.data.data);
// 	})
// 	.catch(error => {
// 		if (error.response.data.detail)vscode.window.showErrorMessage(error.response.data.detail)
// 	})
// }
async function onCheckServerConnection(){
    const loginData = new URLSearchParams();
    loginData.append('username', "2026a2e4238c"); //vscode.workspace.getConfiguration('watcher').get('enrollment')
    loginData.append('password', "string"); //vscode.workspace.getConfiguration('watcher').get('password')
    
    await axios.post('http://127.0.0.1:8083/login', loginData, configForm)
    .then(response => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
        vscode.window.showInformationMessage("Connected to server");
    })
    .catch(error => {
        vscode.window.showErrorMessage("Failed to connect: " + error.message);
    });
}

async function onLogin() {

	const username = await vscode.window.showInputBox({
	  prompt: 'Enter your enrollment',
	  ignoreFocusOut: true
	})

	if (!username) {
	  vscode.window.showWarningMessage('Login canceled (no username provided).')
	  return
	}
  
	const password = await vscode.window.showInputBox({
	  prompt: 'Enter your password',
	  password: true,
	  ignoreFocusOut: true
	})
	if (!password) {
	  vscode.window.showWarningMessage('Login canceled (no password provided).')
	  return
	}

	const params = {
		grant_type: 'password',
		username: username,
		password: password,
		scope: '',
		client_id: 'string',
		client_secret: 'string'
	}
  
	await axios.post('http://0.0.0.0:8083/login', params, configForm)
	.then(response => {
		axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
        vscode.window.showInformationMessage("Authentication successful!");
	})
	.catch(error => {
		if (error.response.data.detail)vscode.window.showErrorMessage(error.response.data.detail)
	})
}

async function onWriteLogs(){
	if(unsavedLogs){
		const editor=vscode.window.activeTextEditor
		await axios.post('http://0.0.0.0:8083/log', { 
			"documentname": getFileName(docRelativeFilePath),
			"documentpath": docRelativeFilePath,
			"language":docLangId,
			changes,
			"linecount": editor.document.lineCount
		}, configJson)
		.then(response => {
			vscode.window.showInformationMessage(response.data.data);
		})
		.catch(error => {
			if (error.response.data.detail)vscode.window.showErrorMessage(error.response.data.detail)
		})
		changes=[];
        unsavedLogs=false;
	}
}
//------------------------------------//
//-----------------ASYNC HANDLING FUNCTIONS--------------------//
//ok
async function handleNewActiveEditor(editor){
	if(unsavedLogs){
        addChangeObject("end", new Date(), "","");
        await onWriteLogs();
    }

	cleanUp();
	//initialize the document variables
	if(editor){
        initializeDocumentVariables(editor.document)
    } else {
        docActive=false
        isTimerRunning=false
    } if(docActive){
		await runTimer();
	}
}
//ok
async function runTimer(){
    //console.log("starting timer");
    isTimerRunning=true
    idleTime=0

    addChangeObject("start",new Date(),"",activeLine)
    await setInterval(async ()=>{
        idleTime+=1;
        if(idleTime>6){
            await onWriteLogs()
        }
    },5000)
    
}

//-------------------- SYNC HANDLING FUNCTIONS----------------------
//ok
async function handleFocusChange(state){
	if(isTimerRunning){
        if(state.focused){
            //can push an object to changes
            addChangeObject("focus",new Date(),"","");
        }
        else{
            //can push an object to changes
            addChangeObject("unfocus",new Date(),"","");
            await onWriteLogs();
        }
    }
}
//ok
function handleDocumentChange(event) {
	if(isTimerRunning && docActive){
        idleTime=0;
        for (const change of event.contentChanges){
            activeLine= vscode.window.activeTextEditor.document.lineAt(change.range.start.line).text;
            
            const textInserted=change.text;
            if(textInserted.length>3){
                addChangeObject("insertion",new Date(), textInserted,activeLine);
            }
            else if(textInserted.length<1){
                const deletedText=extractDeletedPortion(docText,event.document.getText());
                addChangeObject("deletion",new Date(), deletedText,activeLine);
            }
        }
        docText=event.document.getText();
    }
}
//ok
async function handlePasteAction() {
	const editor = vscode.window.activeTextEditor;
  	if (!editor) return
	// Pega o conteúdo atual antes do paste
	const beforeText = editor.document.getText();
	// Executa o paste
	await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
	// Aguarda um tick do event loop para garantir que o conteúdo foi colado
	await new Promise(resolve => setTimeout(resolve, 50));
	// Pega o conteúdo após o paste
	const afterText = editor.document.getText();
	// Calcula o trecho colado
	const pastedText = extractInsertedPortion(beforeText, afterText); // você precisa implementar essa função

    await addChangeObject("paste",new Date(),pastedText,"");
}
//ok
async function handleCopyAction() {
    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
    await new Promise(resolve => setTimeout(resolve, 50)); // Garante que a cópia terminou

    const clipboardText = await vscode.env.clipboard.readText();
    if (clipboardText && clipboardText.trim() !== "") {
        await addChangeObject("copy", new Date(), "", clipboardText);
    }
}
//ok
function handleSelectionChange(event) {
    currentSelection=event.textEditor.document.getText(event.textEditor.selections[0]);
}

//------------------------------------//
//----------------STANDALONE HELPING FUNCTIONS---------------------//

function getRelativePath(fileName) {
    // Check if there is a workspace and the file is within the workspace
    if (vscode.workspace.workspaceFolders) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fileName));
  
      if (workspaceFolder) {
        // Use asRelativePath to get the relative path
        const relativePath = vscode.workspace.asRelativePath(fileName, false);
        return relativePath;
      }
    }
}

function isProgrammingLanguageId(input) {
    const programmingLanguageIds = [
      'javascript',
      'typescript',
      'python',
      'java',
      'csharp',
      'html',
    ];
  
    return programmingLanguageIds.includes(input.toLowerCase());
}

function extractInsertedPortion(before, after) {
  let start = 0;

  // Encontra onde começam a diferir
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start++;
  }

  // Encontra o final comum (de trás para frente)
  let endBefore = before.length - 1;
  let endAfter = after.length - 1;

  while (endBefore >= start && endAfter >= start && before[endBefore] === after[endAfter]) {
    endBefore--;
    endAfter--;
  }

  // Retorna a parte colada
  return after.slice(start, endAfter + 1);
}

function addChangeObject(type,time,text,line){
    changes.push({
        "type":type,
        "time":time,
        "text":text,
        "line":line
    })
    unsavedLogs=true;
}

function extractDeletedPortion(prev,current){
    //TODO get the deleted portion with log n complexity
    let prefix_length=0;
    while(prefix_length<prev.length && prefix_length<current.length && prev[prefix_length]==current[prefix_length]){
        prefix_length+=1;
    }
    const deletedPortion=prev.slice(prefix_length, prefix_length+(prev.length-current.length))
    return deletedPortion;

}

function getFileName(fileName){
    return fileName.split(".")[0]
}

function initializeDocumentVariables(document){
	cleanUp();
    docAbsoluteFilePath=document.fileName;
    docRelativeFilePath=getRelativePath(docAbsoluteFilePath);
    //isDocUntitled=document.isUntitled;
    docLangId=document.languageId;
    docText=document.getText(); 
    docActive=isProgrammingLanguageId(docLangId);
    activeLine=document.lineAt(vscode.window.activeTextEditor.selection.active.line).text;
}

function cleanUp(){
    idleTime=0; // saves time since last change occured
    isTimerRunning=false; // checks if timer is running

    changes = [];
    currentSelection = ""
    unsavedLogs = false;

    docAbsoluteFilePath="";
    docRelativeFilePath="";
    docLangId="";
    docActive = false;
    docText = "";
}

//------------------------------------//

async function deactivate() {
    await onWriteLogs();
}

module.exports = {
	activate,
	deactivate
}
//I am making a bunch of changes to this file.anges to this file.anges to this file.anges to this file.anges to this file.this file.anges to this file.anges tothis file.anges to this file.anges tothis file.anges to this file.anges to


//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!e!nge in here!nge in here!Typeing!


//Does this still make a change? 



//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!e!nge in here!nge in here!Typeing!


//Does this still make a change? 



//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!e!nge in here!nge in here!Typeing!


//Does this still make a change? 



//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!e!nge in here!nge in here!Typeing!


//Does this still make a change? 



//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!
//This is a big change in here!nge in here!nge in here!e!nge in here!nge in here!Typeing!


//Does this still make a change? this is a big changednge? this is a big changednge? this is a big changednge? this is a big changednge? this is a big changed