class window.Timetable

  constructor: ( node, options = {} ) ->
    unless node?
      throw new Error( "Don't know on which DOM element calendar should be built" )
    @node       = $( node )
    @weekDays   = options.dayNames || [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" ]
    @hourRange  = options.hourRange || [ 7..19 ]
    @events     = options.events
    @hourRange  = [ options.timelapse.start..options.timelapse.end ] if options.timelapse

    @table        = null
    @cell         = null
    @hiddenEvents = {}

    # create calendar
    @createPlanning()
    @drawEvents( options[ 'tooltip' ] )

    window.addEventListener 'resize', =>
      @getCellDimensions()
      @deleteEvents()
      @drawEvents( options[ 'tooltip' ] )

  createPlanning: =>
    # create table
    @node.html Templates.table()
    @table = $( @node, 'table' )

    tableHead = @table.find( 'thead' )
    tableBody = @table.find( 'tbody' )

    tableHead.html Templates.tableHead()

    # fill days
    weekDaysLength = @weekDays.length
    colMd = Math.floor( 12 / weekDaysLength )
    for day in @weekDays
      tableHead.find('tr').append Templates.tableTh( colMd: colMd, day: day )

    # fill hours
    for hour in @hourRange
      tableBody.append Templates.tableTr( hour: hour, days: @weekDays )

    @getCellDimensions()

  getCellDimensions: ->
    td = @table.find("tbody td.day-0").first()
    @cell =
      height: td.height()
      width:  td.width()

  drawEvents: ( tooltip = true ) ->
    for event in @events
      unless @hiddenEvents[ event.id ]
        for time in event.times
          [ startHour, startMinute  ] = time.start.split ':'
          [ endHour, endMinute      ] = time.end.split ':'
          hourElement = @table.find("tr.hour-#{startHour}")
          dayElement  = @table.find("td.day-#{time.day}").first()
          top   = hourElement.offset().top + @cell.height - 1 - hourElement.offsetParent().offset().top
          top  += @cell.height * ( parseInt( startMinute ) / 60 ) # minutes offset
          top  -= @cell.height / 2                                # hour mark is on middle of cell
          left  = dayElement.offset().left + 1 - dayElement.offsetParent().offset().left

          eventNode = $( Templates.event( name: event.name, comment: event.comment, start: time.start, end: time.end) )

          eventHeight = 0
          eventHeight += ( parseInt( endHour ) - parseInt( startHour ) ) * @cell.height - 1
          eventHeight += ( ( (parseInt(endMinute) - parseInt(startMinute) ) / 60 ) * 100 ) * ( @cell.height / 100 ) - 1

          eventNode
            .css 'top',             "#{top}px"
            .css 'left',            "#{left}px"
            .css 'background-color', event.color
            .width  @cell.width + 1
            .height eventHeight

          if tooltip
            eventNode.tooltip
              html:     true,
              trigger:  'hover',
              title:    Templates.eventTooltip( name: event.name, comment: event.comment, other: event.other, start: time.start, end: time.end )

          @table.append eventNode

  deleteEvents: ->
    @table.find( ".event" ).remove()

  toggleEvents: ( eventName ) ->
    @hiddenEvents[ eventName ] = !@hiddenEvents[ eventName ]
    @deleteEvents()
    @drawEvents()


class Templates extends Timetable
  @table: _.template """
  <table class="table table-bordered">
    <thead>
    </thead>
    <tbody>
    </tbody>
  </table>
  """

  @tableHead: _.template '<tr class="day-names"><th class="col-md-1"></th></tr>'

  @tableTh: _.template "<th class='col-md-<%= colMd %> text-center'><%= day %></th>"

  @tableTr: _.template """
  <tr class="hour hour-<%= hour %>">
    <td class='hour-name'>
      <%= hour %>:00
    </td>
    <% _.each( days, function( name, index ) { %>
      <td class="day day-<%= index %>">
        <div>&nbsp;</div>
        <div>&nbsp;</div>
      </td>
      <% }); %>
  </tr>
  """

  @event: _.template """
    <div class='event'>
      <div class='event-name'><%= name %></div>
      <% if ( comment ) { %>
        <div class='event-comment'><%= comment %></div>
      <% } %>
      <div class='event-duration'><%= start %>&nbsp;&ndash;&nbsp;<%= end %></div>
    </div>
    """

  @eventTooltip: _.template """
    <div>
      <div><b><%= name %></b></div>
      <% if ( comment ) { %>
        <div><i><%= comment %></i></div>
      <% } %>
      <% if ( other ) { %>
        <div><%= other %></div>
      <% } %>
      <div><%= start %>&nbsp;&ndash;&nbsp;<%= end %></div>
    </div>
    """
