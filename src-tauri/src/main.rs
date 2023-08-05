// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::runtime::Runtime; 
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

#[derive(Debug,Serialize, Deserialize)]
struct NucleiData {
    nucleiIn: Vec<(i32,i32)>,
    nucleiOut: Vec<(i32,i32)>,
    fiber: Vec<(i32,i32)>,
}
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












































