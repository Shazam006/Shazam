<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function answer(int $status,array $data): never {
 http_response_code($status);
 echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
 exit;
}
function invalid(string $message): never { answer(422,['error'=>$message]); }
function field(mixed $v,int $max,bool $required=false): string {
 if(!is_string($v)||!preg_match('//u',$v)) invalid('Dados inválidos.');
 $v=trim($v);
 if(mb_strlen($v,'UTF-8')>$max||($required&&$v==='')||preg_match('/[\x00-\x1F\x7F]/u',$v)) invalid('Campo inválido ou muito longo.');
 return $v;
}
function b64(string $v): string {return rtrim(strtr(base64_encode($v),'+/','-_'),'=');}
function un64(string $v): string|false {
 if(!preg_match('/^[A-Za-z0-9_-]+$/D',$v)) return false;
 return base64_decode(strtr($v,'-_','+/'),true);
}
function seal(array $payload,string $key): string {
 $iv=random_bytes(12); $tag='';
 $cipher=openssl_encrypt(json_encode($payload,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag,'sorteio-v1',16);
 if($cipher===false) throw new RuntimeException('Encryption failed');
 return b64($iv.$tag.$cipher);
}
function openToken(string $token,string $key): array {
 if(strlen($token)>4096) answer(404,['error'=>'Convite inválido.']);
 $raw=un64($token);
 if($raw===false||strlen($raw)<29) answer(404,['error'=>'Convite inválido.']);
 $plain=openssl_decrypt(substr($raw,28),'aes-256-gcm',$key,OPENSSL_RAW_DATA,substr($raw,0,12),substr($raw,12,16),'sorteio-v1');
 if($plain===false) answer(404,['error'=>'Convite inválido.']);
 $data=json_decode($plain,true);
 if(!is_array($data)||!isset($data['exp'])||$data['exp']<time()) answer(410,['error'=>'Convite expirado.']);
 return $data;
}
try {
 if($_SERVER['REQUEST_METHOD']!=='POST') {header('Allow: POST');answer(405,['error'=>'Use POST.']);}
 if(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json') answer(415,['error'=>'Use JSON.']);
 $body=file_get_contents('php://input',false,null,0,65537);
 if($body===false||strlen($body)>65536) answer(413,['error'=>'Pedido muito grande.']);
 $req=json_decode($body,true,32,JSON_THROW_ON_ERROR);
 if(!is_array($req)) invalid('Pedido inválido.');
 $secret=getenv('DRAW_SECRET');
 if(!is_string($secret)||strlen($secret)<32) answer(503,['error'=>'Servidor ainda não configurado.']);
 $key=hash('sha256',$secret,true);
 $action=$req['action']??'';
 if($action==='create'){
  $list=$req['names']??null;
  if(!is_array($list)||!array_is_list($list)||count($list)<2||count($list)>100) invalid('Informe de 2 a 100 participantes.');
  $names=[];$seen=[];
  foreach($list as $raw){
   $name=field($raw,80,true);
   $normal=mb_strtolower(preg_replace('/\s+/u',' ',$name),'UTF-8');
   if(isset($seen[$normal])) invalid('Nome duplicado: '.$name);
   $seen[$normal]=true;$names[]=$name;
  }
  $event=field($req['event']??'',100,true);
  $date=field($req['date']??'',10);
  if($date!==''){
   $dt=DateTimeImmutable::createFromFormat('!Y-m-d',$date);
   if(!$dt||$dt->format('Y-m-d')!==$date) invalid('Data inválida.');
  }
  $budget=field($req['budget']??'',60);
  $n=count($names);$p=range(0,$n-1);
  // Fisher-Yates uniforme; rejeita permutações com ponto fixo.
  do {
   for($i=$n-1;$i>0;--$i){$j=random_int(0,$i);[$p[$i],$p[$j]]=[$p[$j],$p[$i]];}
   $valid=true;
   foreach($p as $i=>$j){if($i===$j){$valid=false;break;}}
  } while(!$valid);
  $exp=time()+90*86400;$records=[];
  foreach($names as $i=>$name){
   $records[]=['name'=>$name,'token'=>seal(['event'=>$event,'date'=>$date,'budget'=>$budget,'from'=>$name,'to'=>$names[$p[$i]],'exp'=>$exp],$key)];
  }
  answer(201,['records'=>$records,'expires_at'=>gmdate('c',$exp)]);
 }
 if($action==='preview'||$action==='reveal'){
  $d=openToken(field($req['token']??'',4096,true),$key);
  $result=['event'=>$d['event'],'date'=>$d['date'],'budget'=>$d['budget'],'from'=>$d['from']];
  if($action==='reveal')$result['to']=$d['to'];
  answer(200,$result);
 }
 answer(404,['error'=>'Operação inexistente.']);
} catch(JsonException $e){answer(400,['error'=>'JSON inválido.']);}
catch(Throwable $e){error_log('Sorteio API: '.$e::class);answer(500,['error'=>'Não foi possível concluir a operação.']);}
