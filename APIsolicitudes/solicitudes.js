var express    = require('express');
var oracledb    = require('oracledb');
var multer = require('multer');
var cors = require('cors')
require('dotenv').config();
var bodyParser = require('body-parser');

var app        = express(); 
app.use(express.json())
var port = process.env.APP_PORT || 3002;
var upload = multer();

app.use(upload.array()); 
//app.use(bodyParser.json()); // soporte para cuerpos de pagina en json - no lo ocupo, ver abajo
app.use(express.json()) //funciona de express 4.16.0
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());

app.listen(port);
console.log('Iniciado servicio en el puerto: ' + port);

//configuracion datos DB
//la configuracion puede estar en el archivo .env
dbConfig = {
	user          : process.env.NODE_ORACLEDB_USER || "okcasa",
	password      : process.env.NODE_ORACLEDB_PASSWORD ,
	connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=xe)))",
	externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
console.log("Config DB:")	
console.log(dbConfig)
async function init() 
{
	//Configuracion para todas las rutas de localhost
	app.all('/*', function(req, res, next) 
	{
		//Headers no seguros, solo de prueba, permite CSRF
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "X-Requested-With");
		next();
	});

	//Obtiene todos los servicios y retorna un json
	app.get("/solicitudes", async (req, res, next) => 
	{
		console.log("Consultando todos los servicios");
		console.log('Conectandose con la base de datos...');
	  	try 
		{
		//conectarse
		const conexion = await oracledb.getConnection(dbConfig);
		console.log( conexion != null ? "Conexión Exitosa" : "Error en la conexión");
		//consulta
		const result =  await conexion.execute
		(
			// query
			`
			select solicitud.IDSOLICITUD,solicitud.valorinsp, solicitud.descuento,solicitud.idcliente, solicitud.fechasolicitud
			FROM solicitud
			JOIN solicitudtraza traza on (traza.idsolicitud = solicitud.idsolicitud)
			WHERE (SELECT count(idtraza) from solicitudtraza where solicitud.idsolicitud = solicitudtraza.idsolicitud) = 1
			AND traza.idestado = 1
			`,// poner como variable, mayor seguridad, https://github.com/oracle/node-oracledb/issues/946
			{
				//opcional
				// maxRows: 1
			}
		//MAGIA DE EXPRESS - USA PROMESAS - RETORNA EL JSON.
		).then(rows => 
			{	console.log("Entregando solicitudes pendientes");
				console.log(rows.metaData.length);
				console.log(rows.rows.length);
				if (rows.rows.length>0) 
				{
				
				var mijson="{\"filas\":[";					
				for (var i = 0; i < rows.rows.length; i++) 
				{
					mijson+="{";
					for (var j = 0; j < rows.metaData.length; j++) 
					{	
						var llave = rows.metaData[j].name;
						var valor = rows.rows[i][j];
						mijson+="\""+llave+"\":\""+valor+"\",";	
					}
					mijson = mijson.substring(0, mijson.length - 1)
					mijson+="},";
				}
				mijson = mijson.substring(0, mijson.length - 1)
				mijson+="]}";
				console.log(mijson);
				json = JSON.parse(mijson)
				res.json(json);
			
			} else{
				rows["filas"] = rows["metaData"];
				delete rows.metaData;
				res.json(rows);
			}


				
			})
	  		.catch(err => {
				return
	  		});;
		conexion.close()
		//Informacion de la consulta
		}catch (err) {console.error(err);
  		}finally 
  		{
			
	  		
		}		
	});
}
//esto no hace nada
	app.post('/nueva', function(req, res) {
		console.log("Insertando nueva solicitud")
		console.log(req.body);
		res.send("recieved your request!");
});

app.post('/agendarvisita', function(req, res) {
		console.log("Insertando nueva visita")
		//conectarse
		const conexion = await oracledb.getConnection(dbConfig);
		console.log( conexion != null ? "Conexión Exitosa" : "Error en la conexión");
		//consulta
		console.log(req.body);      // el json recibido
		mijson = req.body
		console.log(mijson.comentario)

		/*const result =  await conexion.execute
		(
			// query
			`
			INSERT INTO salidaterreno(idsalida,fecha,comentarios,idsolicitud,idequipo)
			values(null,:fecha,;comentarios,;idsolicitud:idequipo)
			`,// poner como variable, mayor seguridad, https://github.com/oracle/node-oracledb/issues/946
			{
				fecha: { dir: oracledb.BIND_IN, val: mifecha, type: oracledb.DATE },
				comentarios: { dir: oracledb.BIND_IN, val: micomentario, type: oracledb.STRING },
				idsolicitud: { dir: oracledb.BIND_IN, val: miidsolicitud},
				idequipo: { dir: oracledb.BIND_IN, val: miidequipo}

			}
		//MAGIA DE EXPRESS - USA PROMESAS - RETORNA EL JSON.
		).then(rows => 
			{	


				
			})
	  		.catch(err => {
				return
	  		});*/
		//console.log(req.body);
		res.send("recieved your request!");
});
	
init();
