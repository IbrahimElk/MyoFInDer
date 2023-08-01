import webview

def create_window():
    # webview.create_window("My App", "index.html", width=800, height=600)
    webview.create_window('Hello world', 'http://192.168.0.187:8080')
    # webview.start(debug=True)
    webview.start()
if __name__ == "__main__":
    print("what")
    create_window()
    print("wassup")