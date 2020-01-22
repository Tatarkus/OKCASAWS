var express    = require('express');
var oracledb    = require('oracledb');
var app        = express(); 
var cors = require('cors')
require('dotenv').config();
var port = process.env.APP_PORT || 3001;

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
	app.get("/equiposdisponibles", async (req, res, next) => 
	{
		console.log("Consultando los equipos disponibles");
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
			SELECT IDEQUIPO
			FROM EQUIPOTECNICO
			WHERE estadisponible='v'
			`,// poner como variable, mayor seguridad, https://github.com/oracle/node-oracledb/issues/946
			{
				//opcional
				// maxRows: 1
			}
		//MAGIA DE EXPRESS - USA PROMESAS - RETORNA EL JSON.
		).then(rows => 
			{	
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
		//Informacion de la consulta;
		}catch (err) {console.error(err);
  		}finally 
  		{
			
	  		
		}		
	});
}
	//obtiene 1 servicio recibiendo la id
	/*
	app.get("/servicios/:idservicio", (req, res, next) => {
		const conexion = await oracledb.getConnection(dbConfig);
		console.log("Consultando el servicio con id="+req.params.idProducto);
		conexion.query("SELECT * FROM servicio where id= ?", [req.params.idProducto])
		.then(rows => {	
			res.json(rows);
			})
	  .catch(err => {
		return
	  });
	});*/
		
init();
