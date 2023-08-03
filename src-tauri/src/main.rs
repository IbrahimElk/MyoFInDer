// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri_plugin_log::LogTarget;
use std::collections::HashMap;
use std::fs::File;
use tokio::runtime::Runtime; 
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use log::{debug, error, log_enabled, info, Level};

// #[derive(Debug, Serialize,Deserialize)]
// struct Data {
//     data: HashMap<String, ImageData>,
// }
// Struct representing the data for each image
#[derive(Debug, Serialize,Deserialize)]
struct ImageData {
    arr: Vec<u8>,
    width: usize,
    height: usize,
}
#[derive(Debug,Serialize, Deserialize)]
struct NucleiData {
    nucleiIn: Vec<(i32,i32)>,
    nucleiOut: Vec<(i32,i32)>,
    fiber: Vec<(i32,i32)>,
}
    // let image_data_1 = ImageData {
    //     arr: vec![1, 2, 3, 4, 5, 6, 7, 8],
    //     width: 2,
    //     height: 4,
    // };

    // let image_data_2 = ImageData {
    //     arr: vec![10, 20, 30, 40, 50, 60],
    //     width: 2,
    //     height: 3,
    // };

    // // Create the data hashmap
    // let mut data_map = HashMap::new();
    // data_map.insert("image1".to_string(), image_data_1);
    // data_map.insert("image2".to_string(), image_data_2);

    // // Create the Data struct with the data hashmap
    // let output = send_and_receive(data_map);
    // println!["output: {:?}", output]
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_and_receive])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


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



// Define a struct to represent the marker data
#[derive(Debug, Serialize, Deserialize)]
struct Marker {
    x: i32,
    y: i32,
    t: i32,
}

// Define a struct to represent the image data
#[derive(Debug, Serialize, Deserialize)]
struct SavingImages {
}

#[tauri::command]
fn save(file: &SavingImages) -> () {
//FIXME: using db such as sqlite or something, search welke makkelijkste sql achtig is op rust. 
}













































