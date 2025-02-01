from flask import Flask, render_template
import plotly
import plotly.graph_objs as go
import json

app = Flask(__name__)

@app.route('/')
def index():
    data = [go.Scatter(x=[1, 2, 3], y=[10, 11, 12])]
    graphJSON = json.dumps(data, cls=plotly.utils.PlotlyJSONEncoder)
    return render_template('index.html', graphJSON=graphJSON)

if __name__ == '__main__':
    app.run(debug=True)