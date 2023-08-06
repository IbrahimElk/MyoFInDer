// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tokio::runtime::Runtime; 
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use std::fs;
use std::io::Read;
use std::path::Path;
use std::collections::HashMap;


#[derive(Debug,Serialize, Deserialize)]
struct NucleiData {
    nucleiIn: Vec<(i32,i32)>,
    nucleiOut: Vec<(i32,i32)>,
    fiber: Vec<(i32,i32)>,
}

#[derive(Debug,Serialize,Deserialize)]
struct NucleusJSON {
    Xpos: i32,
    Ypos: i32,
    id: i32,
    r#type: i32,
}

#[derive(Debug,Serialize,Deserialize)]
struct FiberJSON {
    area: i32,
    fiberPath: Vec<(i32, i32)>,
    id: i32,
}

#[derive(Debug,Serialize,Deserialize)]
struct ImageData {
    nameImage: String,
    dataUrlBase64: String,
    FiberData: Vec<FiberJSON>,
    NucleiData: Vec<NucleusJSON>,
}

#[derive(Debug, Serialize,Deserialize)]
struct Data {
    title: String,
    data: HashMap<String, ImageData>,
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            send_and_receive,
            save,
            load
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ----------------------------------------------------------------------------------------------------
// SEND AND RECEIVE COMMAND
// ----------------------------------------------------------------------------------------------------
#[tauri::command]
fn send_and_receive(input: &str) -> NucleiData {
    let rt = Runtime::new().unwrap();
    let parsed_data = rt.block_on(async {
        let response: Vec<u8> = send_and_receive_from_server(String::from(input)).await;
        let data_str = String::from_utf8(response).expect("Invalid UTF-8 data");
        serde_json::from_str(&data_str).expect("JSON parsing error")
    });
    return parsed_data;
}

async fn send_and_receive_from_server(json_data: String)-> Vec<u8> {
    let mut buffer = Vec::new();
    let server_address = "127.0.0.1:8000";
    let stream = TcpStream::connect(server_address).await;
    match stream {
        Ok(resolved_stream) => {
            dbg!("ok send_and_receive_from_server");
            return send(json_data,resolved_stream,&mut buffer).await;
        }
        Err(reject) => {
            dbg!["err send_and_receive_from_server {}", reject];
            return Vec::new();
        }
    }
}

async fn send(json_data:String, mut resolved_stream:TcpStream,buffer: &mut Vec<u8>)-> Vec<u8> {
    let json_bytes = json_data.as_bytes();
    let eof_marker = "EOF".as_bytes();
    let _ = resolved_stream.write_all(json_bytes).await;
    let ook  = resolved_stream.write_all(eof_marker).await;
    match ook {
        Ok(()) => {
            println!("Ok send");
            return read(&mut resolved_stream, buffer).await;
        }
        Err(err) =>{
            dbg!(err.to_string());
            return Vec::new();
        }
    }
}

async fn read(stream: &mut TcpStream, buffer: &mut Vec<u8>) -> Vec<u8> {
    loop {
        let mut chunk = vec![0; 1024];
        let res = stream.read(&mut chunk).await;
        println!("res: {:?}", res);
        match res {
            Ok(bytes_read) => {
                println!("Ok read");
                if bytes_read == 0 {
                    break;
                }
                buffer.extend_from_slice(&chunk[..bytes_read]);
            }
            Err(err) => {
                println!("Error while reading from server: {:?}", err);
                break;
            }
        }
    }
    println!("nice");
    return buffer.to_vec();
}

// ----------------------------------------------------------------------------------------------------
// STORE COMMAND
// ----------------------------------------------------------------------------------------------------

#[tauri::command]
fn save(project_path: &str, csv_data: &str, data: Data) {
    let existing = Path::new(&project_path).exists();

    if !existing {
        fs::create_dir_all(&project_path).unwrap();
    }

    let csv_path = format!("{}/{}.csv", &project_path, data.title);
    fs::write(&csv_path, csv_data).unwrap();

    let binary_path = format!("{}/{}.bin", &project_path, data.title);
    
    let stringified_DATA = serde_json::to_string(&data).unwrap();
    let binary_data = stringified_DATA.as_bytes();
    fs::write(&binary_path, &binary_data).unwrap();

    let image_folder_path = format!("{}/images/", &project_path);
    extract_and_save_images(&image_folder_path, &data);
}

fn extract_and_save_images(folder_path: &str, save_data: &Data) {
    // Create the "images" folder if it doesn't exist
    if !Path::new(folder_path).exists() {
        fs::create_dir(folder_path).unwrap();
    }

    // Loop through the data object and extract image data
    for (image_id, image_data) in &save_data.data {
        let name_image = &image_data.nameImage;
        let data_url_base64 = &image_data.dataUrlBase64;

        // Convert base64 string to binary
        let base64_data = data_url_base64.replace("data:image/png;base64,", "");
        let binary_data = base64_data.as_bytes();

        let image_path = format!("{}{}", folder_path, name_image);
        fs::write(&image_path, binary_data).unwrap();
    }
}

// ----------------------------------------------------------------------------------------------------
// LOAD COMMAND
// ----------------------------------------------------------------------------------------------------
#[tauri::command]
fn load(full_path: &str) -> Vec<u8> {
    // Read the .bin file from the directory
    let mut loaded_binary = Vec::new();
    if let Ok(mut file) = fs::File::open(full_path) {
        file.read_to_end(&mut loaded_binary).unwrap_or_default();
    }
    return loaded_binary;
}