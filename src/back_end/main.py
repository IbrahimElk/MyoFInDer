import webview
def create_window():
    # webview.create_window("My App", "index.html", width=800, height=600)
    webview.create_window('Hello world', 'index.html')
    # webview.start(debug=True)
    webview.start()
if __name__ == "__main__":
    create_window()
